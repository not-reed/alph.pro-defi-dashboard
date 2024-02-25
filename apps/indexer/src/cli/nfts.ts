import {
	addressFromContractId,
	binToHex,
	contractIdFromAddress,
	hexToString,
} from "@alephium/web3";
import { cache } from "../cache";
import { config } from "../config";
import type { ContractAddress } from "../services/common/types/brands";
import { logger } from "../services/logger";
import { db } from "../database/db";
import type { NewNft } from "../database/schemas/public/Nft";
import type { NewNftCollection } from "../database/schemas/public/NftCollection";
import type { NewNftAttribute } from "../database/schemas/public/NftAttribute";
import { chunkArray } from "../utils/arrays";
import { sql } from "kysely";

const CACHE_TIME = 15 * 60; // one hour

const explorerHeaders: Record<string, string> = {
	Accept: "application/json",
	"Content-Type": "application/json",
};

if (config.EXPLORER_BASIC_AUTH) {
	explorerHeaders.Authorization = `Basic ${config.EXPLORER_BASIC_AUTH}`;
}
const nodeHeaders: Record<string, string> = { Accept: "application/json" };

if (config.NODE_BASIC_AUTH) {
	nodeHeaders.Authorization = `Basic ${config.NODE_BASIC_AUTH}`;
}

if (config.NODE_API_KEY) {
	nodeHeaders["X-API-KEY"] = config.NODE_API_KEY;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function findUnprocessedNfts() {
	let unprocessed = (await db
		.selectFrom("Balance")
		.select("tokenAddress")
		.distinct()
		.where((a) =>
			a.and([
				a.not(
					a.exists(
						a
							.selectFrom("Token")
							.whereRef("Token.address", "=", "Balance.tokenAddress"),
					),
				),

				a.not(
					a.exists(
						a
							.selectFrom("Nft")
							.whereRef("Nft.address", "=", "Balance.tokenAddress"),
					),
				),
			]),
		)
		.execute()
		.then((a) => a.map((b) => b.tokenAddress))) as ContractAddress[];
	// if (unprocessed.length === 0) {
	// }
	const one = unprocessed[0];
	// console.log({ one });
	// return;
	// get parent of above contract
	const parent = await fetchOrCallback(
		`${config.EXPLORER_URL}/contracts/${one}/parent`,
		CACHE_TIME,
		async () =>
			await fetch(`${config.EXPLORER_URL}/contracts/${one}/parent`, {
				headers: explorerHeaders,
			}).then((a) => a.json()),
	);
	if (parent.parent) {
		const subContracts: string[] = [];
		let page = 1;
		const limit = 100;
		do {
			const subContractResponse = await fetchOrCallback(
				`${config.EXPLORER_URL}/contracts/${parent.parent}/sub-contracts?limit=${limit}&page=${page}`,
				CACHE_TIME,
				async () =>
					await fetch(
						`${config.EXPLORER_URL}/contracts/${parent.parent}/sub-contracts?limit=${limit}&page=${page}`,
						{
							headers: explorerHeaders,
						},
					).then((a) => a.json()),
			);
			if (subContractResponse.subContracts.length === 0) {
				break;
			}

			subContracts.push(...subContractResponse.subContracts);
			page++;
		} while (subContracts.length !== 0 && subContracts.length % limit === 0);

		// remove processed contracts
		unprocessed = unprocessed.filter((a) => !subContracts.includes(a));

		const contractChunks = chunkArray(subContracts, 80);
		interface NftMetadataRaw {
			id: string;
			tokenUri: string;
			collectionId: string;
			nftIndex: string;
		}
		const responses: NftMetadataRaw[] = [];
		for (const chunk in contractChunks) {
			const metadataResponse = await fetchOrCallback(
				`${config.EXPLORER_URL}/tokens/nft-metadata_${parent.parent}_[${chunk}]`,
				CACHE_TIME,
				async () =>
					await fetch(`${config.EXPLORER_URL}/tokens/nft-metadata`, {
						headers: explorerHeaders,
						method: "POST",
						body: JSON.stringify(
							contractChunks[chunk].map((address) =>
								binToHex(contractIdFromAddress(address)),
							),
						),
					}).then((a) => a.json()),
			);

			responses.push(...metadataResponse);
		}

		await processCollection(parent.parent);
		await db.transaction().execute(async (trx) => {
			const updates = responses.map((r) => ({
				address: addressFromContractId(r.id),
				uri: r.tokenUri,
				collectionAddress: parent.parent,
				nftIndex: BigInt(r.nftIndex),
				tokenIndex: BigInt(r.nftIndex),
			}));
			// console.log({ updates });
			const t = await trx
				.updateTable("Nft")
				.from(values(updates, "c"))
				.set((eb) => ({
					address: eb.ref("c.address"),
					uri: eb.ref("c.uri"),
				}))
				.whereRef("Nft.collectionAddress", "=", "c.collectionAddress")
				.where((ab) => sql<boolean>`"Nft"."nftIndex" = c."nftIndex"::numeric`)
				.returningAll()
				.execute();

			console.log(
				`Finished processing collection ${t.length} Minted NFT's for this collection`,
			);

			// TODO: check for existing tokens that are not in the DB
		});
		// console.log({ responses });
	}
}

export async function processCollection(collectionAddress: ContractAddress) {
	const exists = await db
		.selectFrom("NftCollection")
		.where("address", "=", collectionAddress)
		.executeTakeFirst();
	if (exists) {
		console.log(`Collection ${collectionAddress} already exists, skipping`);
		return true;
	}
	const result = await fetchNftCollectionMetadata(collectionAddress);
	if (!result) {
		return false;
	}

	await db.transaction().execute(async (trx) => {
		const collectionData = {
			address: collectionAddress,
			uri: result.collection.collectionUri,
			image: result.meta.image,
			name: result.meta.name,
			description: result.meta.description,
			raw: result.meta,
		} satisfies NewNftCollection;

		const insertedCollection = await trx
			.insertInto("NftCollection")
			.values(collectionData)
			.returningAll()
			.onConflict((col) => col.doNothing())
			.executeTakeFirst();

		const tokens: NewNft[] = [];
		for (const token of result.tokens) {
			tokens.push({
				collectionAddress: collectionData.address,
				address: null, // fill in later
				tokenId: null, // fill in later
				nftIndex: BigInt(token.nftIndex),
				name: token.name,
				image: token.image,
				description: token.description || "",
				uri: `${collectionData.uri}/${token.nftIndex}`, // assumed deadrare format for now, will be fixed later
				raw: token,
			} satisfies NewNft);
		}

		const insertedTokens = await trx
			.insertInto("Nft")
			.values(tokens)
			.returningAll()
			.onConflict((col) => col.doNothing())
			.execute();

		const attributes: NewNftAttribute[] = [];
		for (const token of insertedTokens) {
			try {
				const raw = token.raw;
				// const attrs = token.raw.attributes
				if (
					!raw ||
					typeof raw !== "object" ||
					!("attributes" in raw) ||
					!Array.isArray(raw.attributes)
				) {
					continue;
				}

				const tokenAttributes = raw.attributes.map((a) => {
					return {
						collectionAddress,
						nftId: token.id,
						key: a.trait_type,
						value: a.value,
						raw: a,
					} satisfies NewNftAttribute;
				});
				attributes.push(...tokenAttributes);
			} catch {
				console.warn("error");
			}
		}

		if (attributes.length) {
			await trx.insertInto("NftAttribute").values(attributes).execute();
		}

		console.log(`Finished processing collection ${result.meta.name}`);
	});

	return true;
}

async function fetchOrCacheJson(url: string, ttl: number = CACHE_TIME) {
	return fetchOrCallback(url, ttl, async () => {
		return await fetch(url).then((a) => a.json());
	});
}

async function fetchOrCallback(
	key: string,
	ttl: number,
	callback: () => Promise<unknown>,
) {
	const PREFIX = 4; // cache bust
	const cached = await cache.get(`${PREFIX}_${key}`);

	if (cached) {
		logger.info(`Cache hit for ${PREFIX}_${key}`);
		return JSON.parse(cached);
	}
	logger.info(`Cache miss for ${PREFIX}_${key}`);
	const fetched = await callback();
	logger.info(`Fetched ${PREFIX}_${key}`);
	if (ttl) {
		cache.set(`${PREFIX}_${key}`, JSON.stringify(fetched), "EX", ttl);
	} else {
		cache.set(`${PREFIX}_${key}`, JSON.stringify(fetched));
	}
	logger.info(`Cached ${PREFIX}_${key}`);
	return fetched;
}

async function fetchNftCollectionMetadata(collectionAddress: ContractAddress) {
	interface CollectionInfo {
		collectionUri: string;
		totalSupply: `${number}`;
	}

	interface NFTInfo {
		image: string;
		name: string;
		description: string;
	}
	const [collection]: CollectionInfo[] = await fetchOrCallback(
		`nft-${collectionAddress}`,
		CACHE_TIME,
		async () => {
			return await fetch(
				`${config.EXPLORER_URL}/tokens/nft-collection-metadata`,
				{
					method: "POST",
					headers: explorerHeaders,
					body: JSON.stringify([collectionAddress]),
				},
			).then((a) => a.json());
		},
	);
	if (!collection) {
		console.log("Failed, skipping");
		return;
	}

	const meta: NFTInfo = await fetchOrCallback(
		collection.collectionUri,
		CACHE_TIME,
		async () => await fetch(collection.collectionUri).then((a) => a.json()),
	);

	const state = await fetchOrCallback(
		`state-${collectionAddress}`,
		CACHE_TIME,
		async () => {
			return await fetch(
				`${config.NODE_URL}/contracts/${collectionAddress}/state?group=0`,
				{
					method: "GET",
					headers: nodeHeaders,
				},
			).then((a) => a.json());
		},
	);

	if (collectionAddress !== "22vxm543X8aEkqu31spuRGkaiNyN5hsmWaSP4o3c46tVd") {
		const [amount, ttoken] = state.immFields;
		const [
			idk,
			collectionUrl,
			metadataUrl,
			owner,
			maxSupply,
			price,
			ten,
			totalSupply,
		] = state.mutFields;

		// TODO: this may not be the case
		const ids = Array(Number(maxSupply.value))
			.fill(0)
			.map((a, i) => i);

		const metas = [];
		for (const i of ids) {
			const url = hexToString(metadataUrl.value);
			const one = await fetchOrCacheJson(
				`${url}${url.endsWith("/") ? "" : "/"}${i}`,
			);
			metas.push({
				...one,
				nftIndex: i,
			});
		}

		return {
			collection: {
				...collection,
				totalSupply: BigInt(maxSupply.value), // TODO: this or totalSupply?
			},
			meta,
			tokens: metas,
		};
		// biome-ignore lint/style/noUselessElse: <explanation>
	} else {
		// alephium vending machine
		const ids = Array(Number(1000))
			.fill(0)
			.map((a, i) => i);
		const metas = [];
		for (const i of ids) {
			const url = hexToString(state.mutFields[0].value);
			const one = await fetchOrCacheJson(
				`${url}${url.endsWith("/") ? "" : "/"}${i + 1}`,
			);
			metas.push({
				...one,
				nftIndex: i + 1,
			});
		}
		return {
			collection: {
				...collection,
				totalSupply: 1000n, // TODO: this or totalSupply?
			},
			meta,
			tokens: metas,
		};
	}
}

//kysely bulk update helper
function values<R extends Record<string, unknown>, A extends string>(
	records: R[],
	alias: A,
) {
	// Assume there's at least one record and all records
	// have the same keys.
	const keys = Object.keys(records[0]);

	// Transform the records into a list of lists such as
	// ($1, $2, $3), ($4, $5, $6)
	const values = sql.join(
		records.map((r) => sql`(${sql.join(keys.map((k) => r[k]))})`),
	);

	// Create the alias `v(id, v1, v2)` that specifies the table alias
	// AND a name for each column.
	const wrappedAlias = sql.ref(alias);
	const wrappedColumns = sql.join(keys.map(sql.ref));
	const aliasSql = sql`${wrappedAlias}(${wrappedColumns})`;

	// Finally create a single `AliasedRawBuilder` instance of the
	// whole thing. Note that we need to explicitly specify
	// the alias type using `.as<A>` because we are using a
	// raw sql snippet as the alias.
	return sql<R>`(values ${values})`.as<A>(aliasSql);
}
