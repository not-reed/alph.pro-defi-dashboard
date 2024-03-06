import type { Block } from "../services/sdk/types/block";

import { Plugin } from "../common/plugins/abstract";
import type Database from "../database/schemas/Database";
import type { Transaction } from "kysely";
import type { NewToken } from "../database/schemas/public/Token";
import { db } from "../database/db";
import { addressFromContractId, hexToString } from "@alephium/web3";
import type { ContractAddress } from "../services/common/types/brands";
import { logger } from "../services/logger";
import explorerService from "../services/explorer";
import { ALPH_ADDRESS } from "../core/constants";
import type { NewNft } from "../database/schemas/public/Nft";
import type { NewNftCollection } from "../database/schemas/public/NftCollection";
import type { NewNftAttribute } from "../database/schemas/public/NftAttribute";
import sdk from "../services/sdk";
import type { NodeState } from "../services/node/types/state";
import type { Artifact } from "../services/common/types/artifact";
import NFTPublicSaleCollectionSequentialWithRoyaltyArtifact from "../abi/deadrare/NFTPublicSaleCollectionSequentialWithRoyalty.ral.json";

interface PluginData {
	nfts: NewNft[];
	collections: NewNftCollection[];
	attributes: Map<string, Omit<NewNftAttribute, "nftId">[]>;
}

const EMPTY = { nfts: [], attributes: new Map(), collections: [] };

export class NftPlugin extends Plugin<PluginData> {
	PLUGIN_NAME = "nfts";

	// process data to prepare for inserts
	// return data to be saved.
	// whatever is returned here will be passed to the insert function
	async process(blocks: Block[]): Promise<PluginData> {
		const tokenAddresses = new Set<ContractAddress>();
		for (const block of blocks) {
			for (const transaction of block.transactions) {
				for (const token of transaction.outputs) {
					// TODO: not strictly true as erc1155 exist,
					// however for now, and for this plugin its acceptable
					if (token.amount === 1n) {
						tokenAddresses.add(token.tokenAddress);
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

		if (tokenAddresses.size > 0) {
			// if its found, we can ignore it completely
			const found = await db
				.selectFrom("Nft")
				.selectAll()
				.where("address", "in", Array.from(tokenAddresses))
				.execute();

			const foundSet = new Set(found.map((token) => token.address));

			const missingSet = new Set(
				Array.from(tokenAddresses).filter((a) => !foundSet.has(a)),
			);

			// none are missing, abort
			if (!missingSet.size) {
				return EMPTY;
			}

			// TODO: this fails on some, such as 'shades of defi'
			const nftMetadata = await this.loadNonFungibleMetadata(missingSet);

			for (const meta of nftMetadata) {
				newNfts.set(meta.address as ContractAddress, {
					collectionAddress: meta.collectionAddress,
					address: meta.address,
					tokenId: null,
					nftIndex: meta.nftIndex,
					name: meta.name,
					image: meta.image,
					description: meta.description,
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
			const collections = collectionAddresses.length
				? await db
						.selectFrom("NftCollection")
						.selectAll()
						.where("address", "in", collectionAddresses)
						.execute()
				: [];

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
		};
	}

	// insert data
	async insert(trx: Transaction<Database>, data: PluginData) {
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
	): Omit<NewNftAttribute, "nftId" | "contractAddress">[] {
		const tokenAttributes = json.attributes.map((a) => {
			return {
				key: a.trait_type,
				value: a.value,
				raw: a,
			};
		});
		return tokenAttributes;
	}

	private async loadCollectionMetadata(
		collections: ContractAddress[],
	): Promise<NewNftCollection[]> {
		if (!collections.length) {
			return [];
		}

		const newCollections: NewNftCollection[] = [];
		// const metadatas = await sdk.fetchNftCollectionMetadata(collections);
		//
		for (const collection of collections) {
			const rawState = await sdk.fetchState(collection);
			const state = sdk.parseState(
				rawState as NodeState,
				NFTPublicSaleCollectionSequentialWithRoyaltyArtifact as unknown as Artifact,
			);
			const rawUri = state.fields.find(
				(a) => a.name === "collectionUri",
			)?.value;

			const uri = hexToString(rawUri as string);
			const data = await fetch(uri).then((a) => a.json());

			newCollections.push({
				address: collection,
				uri: uri,
				image: data.image,
				name: data.name,
				description: data.description,
				raw: data,
			});
		}

		return newCollections;
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
			const address = addressFromContractId(nft.id);
			const json = await fetch(nft.tokenUri).then((a) => a.json());
			newNfts.push({
				address: address,
				collectionAddress: addressFromContractId(nft.collectionId),
				nftIndex: BigInt(nft.nftIndex),
				uri: nft.tokenUri,
				image: json.image,
				description: json.description,
				name: json.name,
				raw: json,
			});
		}

		return newNfts;
	}
}
