import type { Block } from "../services/sdk/types/block";

import { Plugin } from "../common/plugins/abstract";
import type Database from "../database/schemas/Database";
import type { Transaction } from "kysely";
import type { NewToken } from "../database/schemas/public/Token";
import { db } from "../database/db";
import {
	addressFromContractId,
	hexToString,
	type NFTMetaData,
} from "@alephium/web3";
import type {
	ContractAddress,
	TransactionHash,
} from "../services/common/types/brands";
import { logger } from "../services/logger";
import explorerService from "../services/explorer";
import { ALPH_ADDRESS } from "../core/constants";
import type { NewNft } from "../database/schemas/public/Nft";
import type { NewNftCollection } from "../database/schemas/public/NftCollection";
import type { NewNftAttribute } from "../database/schemas/public/NftAttribute";
import sdk from "../services/sdk";
import type { NodeState } from "../services/node/types/state";
import type { Artifact } from "../services/common/types/artifact";
import DeadRareNFTPublicSaleCollectionSequentialWithRoyaltyArtifact from "../abi/deadrare/NFTPublicSaleCollectionSequentialWithRoyalty.ral.json";
import GoldCastleClubNFTPublicSaleCollectionRandomWithRoyaltyArtifact from "../abi/gold-castle-club/NFTPublicSaleCollectionRandomWithRoyalty.ral.json";
import { findCollections } from "../database/services/nftCollection";
import { findNftOrTokenAddresses } from "../database/services/nft";
import { cache } from "../cache";
import type { NewPluginBlock } from "../database/schemas/public/PluginBlock";

const METADATA_CACHE_TIME = 60 * 15; // 15 minutes

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
interface PluginData {
	nfts: NewNft[];
	collections: NewNftCollection[];
	attributes: Map<string, Omit<NewNftAttribute, "nftId">[]>;
	transactions: NewPluginBlock[];
}

const EMPTY = {
	nfts: [],
	attributes: new Map(),
	collections: [],
	transactions: [],
};

export class NftPlugin extends Plugin<PluginData> {
	PLUGIN_NAME = "nfts";

	// process data to prepare for inserts
	// return data to be saved.
	// whatever is returned here will be passed to the insert function
	async process(blocks: Block[]): Promise<PluginData> {
		const tokenAddresses = new Set<ContractAddress>();
		const txHashMapByAddress = new Map<string, string>();

		for (const block of blocks) {
			for (const transaction of block.transactions) {
				for (const token of transaction.outputs) {
					// TODO: not strictly true as erc1155 exist,
					// however for now, and for this plugin its acceptable
					if (token.amount === 1n) {
						tokenAddresses.add(token.tokenAddress);

						// this will get one transaction, essentially at random
						// every hash would be too much, and for this plugin its not needed
						txHashMapByAddress.set(
							token.tokenAddress,
							transaction.transactionHash,
						);
					}
				}
			}
		}

		if (tokenAddresses.size === 0) {
			return EMPTY;
		}

		const newNfts = new Map<string, NewNft>();
		const newCollections = new Map<string, NewNftCollection>();
		const attributes = new Map<string, Omit<NewNftAttribute, "nftId">[]>();
		const processedTransactions = new Set<TransactionHash>();

		if (tokenAddresses.size > 0) {
			// if its found, we can ignore it completely
			const found = await findNftOrTokenAddresses(Array.from(tokenAddresses));

			const foundSet = new Set(found.map((token) => token.address));

			const missingSet = new Set(
				Array.from(tokenAddresses).filter((a) => !foundSet.has(a)),
			);

			// none are missing, abort
			if (!missingSet.size) {
				return EMPTY;
			}

			const nftMetadata = await this.loadNonFungibleMetadata(missingSet);

			for (const meta of nftMetadata) {
				processedTransactions.add(
					txHashMapByAddress.get(meta.address as string) as TransactionHash,
				);
				newNfts.set(meta.address as ContractAddress, {
					collectionAddress: meta.collectionAddress,
					address: meta.address,
					tokenId: null,
					nftIndex: meta.nftIndex,
					name: meta.name,
					image: meta.image,
					description: meta.description || "",
					uri: meta.uri,
					raw: meta.raw,
				} satisfies NewNft);

				const newAttributes = this.parseAttributes(meta.raw);

				if (newAttributes?.length) {
					attributes.set(
						meta.address as string,
						newAttributes.map((attr) => {
							return {
								...attr,
								collectionAddress: meta.collectionAddress,
							};
						}),
					);
				}
			}

			const collectionAddresses: string[] = Array.from(
				new Set(nftMetadata.map((nft) => nft.collectionAddress)),
			);
			const collections = await findCollections(collectionAddresses);

			const missedCollections = collectionAddresses.filter(
				(address) => !collections.find((col) => col.address === address),
			) as ContractAddress[];

			const collectionMetadata =
				await this.loadCollectionMetadata(missedCollections);

			for (const meta of collectionMetadata) {
				newCollections.set(meta.address, meta);
			}
		}

		return {
			nfts: Array.from(newNfts.values()),
			collections: Array.from(newCollections.values()),
			attributes: attributes,
			transactions: Array.from(processedTransactions).map((hash) => ({
				blockHash: hash,
				pluginName: this.PLUGIN_NAME,
			})),
		};
	}

	// insert data
	async insert(trx: Transaction<Database>, data: PluginData) {
		// TODO: don't need to save this, too much data
		// await trx
		//   .insertInto("PluginBlock")
		//   .values(data.transactions) // throw on conflict
		//   .execute();

		if (data.nfts.length) {
			const inserted = await trx
				.insertInto("Nft")
				.values(data.nfts)
				.onConflict((col) =>
					col.columns(["collectionAddress", "nftIndex"]).doUpdateSet((eb) => ({
						address: eb.ref("excluded.address"),
						uri: eb.ref("excluded.uri"),
					})),
				)
				.returningAll()
				.execute();

			for (const insert of inserted) {
				const address = insert.address;
				const attributes = address ? data.attributes.get(address) : [];
				if (address && attributes?.length) {
					await trx
						.insertInto("NftAttribute")
						.values(
							attributes.map((attribute) => ({
								...attribute,
								value: attribute.value || "", // its not null :shrug:
								nftId: insert.id,
							})),
						)
						.execute();
				}
			}
		}

		if (data.collections.length) {
			await trx
				.insertInto("NftCollection")
				.values(data.collections)
				.onConflict((col) => col.doNothing())
				.execute();
		}
	}

	private parseAttributes(
		json: unknown,
	): Omit<NewNftAttribute, "nftId" | "collectionAddress">[] {
		if (!json || typeof json !== "object") {
			throw new Error("Unable to parse JSON");
		}

		if ("error" in json && json.error === true) {
			return [];
		}

		if (!("attributes" in json) || !Array.isArray(json.attributes)) {
			return [];
		}

		return json.attributes.map((a) => {
			return {
				key: a.trait_type as string,
				value: a.value as string,
				raw: a as unknown,
			};
		});
	}

	private async fetchCollectionUri(
		collection: ContractAddress,
	): Promise<string> {
		try {
			// attempt to parse from node state directly
			const rawState = await sdk.fetchState(collection);

			const state = this.safelyParseState(rawState as NodeState);

			const rawUri = state.fields.find(
				(a) => a.name === "collectionUri",
			)?.value;

			return hexToString(rawUri as string);
		} catch {}

		try {
			const [metadata] = await sdk.fetchNftCollectionMetadata([collection]);
			if (
				metadata &&
				typeof metadata === "object" &&
				"collectionUri" in metadata &&
				typeof metadata.collectionUri === "string"
			) {
				return metadata.collectionUri;
			}
		} catch {}
		throw new Error(
			`Unable to fetch collection uri for contract ${collection}`,
		);
	}

	private async loadCollectionMetadata(
		collections: ContractAddress[],
	): Promise<NewNftCollection[]> {
		if (!collections.length) {
			return [];
		}

		const newCollections: NewNftCollection[] = [];

		for (const collection of collections) {
			const uri = await this.fetchCollectionUri(collection);

			try {
				const data = await fetch(uri).then((a) => a.json());

				newCollections.push({
					address: collection,
					uri: uri,
					image: data.image,
					name: data.name,
					description: data.description,
					raw: data,
				});
			} catch (err) {
				logger.error(
					`Error processing NFT collection ${collection} => uri=${uri}`,
				);
				throw err;
			}
		}

		return newCollections;
	}

	private safelyParseState(
		state: NodeState,
	): ReturnType<typeof sdk.parseState> {
		try {
			return sdk.parseState(
				state as NodeState,
				DeadRareNFTPublicSaleCollectionSequentialWithRoyaltyArtifact as unknown as Artifact,
			);
		} catch {
			// not a deadrare collection
		}

		try {
			return sdk.parseState(
				state as NodeState,
				GoldCastleClubNFTPublicSaleCollectionRandomWithRoyaltyArtifact as unknown as Artifact,
			);
		} catch {
			// not a Old Asia collection
		}

		throw new Error("Unable to parse state");
	}

	private async safelyGetJsonData(
		nft: NFTMetaData,
		retries = 0,
	): Promise<{ raw: unknown; json: unknown }> {
		const cache_ = await cache.get(nft.tokenUri);

		if (cache_) {
			logger.info(`CACHE HIT ${nft.tokenUri}`);
			const json = JSON.parse(cache_);
			return { raw: json, json };
		}
		if (retries > 1) {
			logger.warn({
				msg: "Too many retries",
				nft,
			});
			await wait(5000);
			throw new Error("Too many retries");
		}
		console.log(`Fetching: "${nft.tokenUri}"`);
		const response = await fetch(nft.tokenUri);
		if (response.status === 404) {
			return {
				raw: { error: true, reason: "404: not found", raw: "" },
				json: { image: "", description: "", name: "", attributes: [] },
			};
		}
		if (response.status !== 200) {
			throw new Error(
				`Invalid response: ${response.status} => ${nft.tokenUri}`,
			);
		}

		let json: unknown = {};
		try {
			json = await response.clone().json();
			if (json) {
				await cache.set(
					nft.tokenUri,
					JSON.stringify(json),
					"EX",
					METADATA_CACHE_TIME,
				); // 24 hours, MUCH to long for prod
			}

			return { raw: json, json };
		} catch (err) {
			const text = await response.clone().text();
			if (text) {
				await cache.set(
					nft.tokenUri,
					JSON.stringify(text),
					"EX",
					METADATA_CACHE_TIME,
				); // 24 hours, MUCH to long for prod
			}

			if (text === "" && response.url.includes("arweave")) {
				if (response.redirected && response.url !== nft.tokenUri) {
					return await this.safelyGetJsonData(
						{ ...nft, tokenUri: response.url },
						retries, // don't increase retries
					);
				}
				// arweave or cloudfront returning empty responses sometimes,
				// only solution is to retry
				logger.warn({
					msg: "Empty response - retrying...",
					data: { err, nft, text, json, response },
				});

				await wait(1000);

				return await this.safelyGetJsonData(nft, retries + 1);
			}

			return {
				raw: { error: true, reason: "invalid json", raw: text },
				json: { image: "", description: "", name: "", attributes: [] },
			};
		}
	}

	private async loadNonFungibleMetadata(
		tokens: Set<ContractAddress>,
	): Promise<NewNft[]> {
		if (!tokens.size) {
			return [];
		}
		const newNfts: NewNft[] = [];
		const metadatas = await sdk.fetchNonFungibleMetadata(Array.from(tokens));
		for (const nft of metadatas) {
			try {
				const address = addressFromContractId(nft.id);

				const { raw, json } = await this.safelyGetJsonData(nft);
				if (!json || typeof json !== "object") {
					throw new Error("Invalid JSON");
				}

				newNfts.push({
					address: address,
					collectionAddress: addressFromContractId(nft.collectionId),
					nftIndex: BigInt(nft.nftIndex),
					uri: nft.tokenUri,
					image:
						"image" in json && typeof json.image === "string" ? json.image : "",
					name:
						"name" in json && typeof json.name === "string" ? json.name : "",
					description:
						"description" in json && typeof json.description === "string"
							? json.description
							: "",
					raw: raw, // TODO: THIS CAN BE INVALID JSON!
				});
			} catch (err) {
				await wait(30_000);
				logger.error({
					msg: "Error processing NFT",
					err,
					nft,
				});
				throw err;
			}
		}

		return newNfts;
	}
}
