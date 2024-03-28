import {
  addressFromContractId,
  binToHex,
  contractIdFromAddress,
  fetchContractState,
  hexToString,
} from "@alephium/web3";
import { cache } from "../cache";
import { config } from "../config";
import type {
  BlockHash,
  ContractAddress,
} from "../services/common/types/brands";
import { logger } from "../services/logger";
import { db } from "../database/db";
import type { NewNft, NftUpdate } from "../database/schemas/public/Nft";
import type { NewNftCollection } from "../database/schemas/public/NftCollection";
import type { NewNftAttribute } from "../database/schemas/public/NftAttribute";
import { chunkArray } from "../utils/arrays";
import { sql } from "kysely";
import sdk from "../services/sdk";
import type { NewBalance } from "../database/schemas/public/Balance";
import NFTPublicSaleCollectionSequentialWithRoyaltyArtifact from "../abi/deadrare/NFTPublicSaleCollectionSequentialWithRoyalty.ral.json";
import type { Artifact } from "../services/common/types/artifact";
import type { NodeState } from "../services/node/types/state";
import { updateNftBalances } from "../database/services/balance";
import { bulkUpdateNft } from "../database/services/nft";
import { processBlocks } from "./plugin";

const CACHE_TIME =
  process.env.NODE_ENV === "production" ? 15 * 60 : 60 * 60 * 6; // 15 minutes in prod, 6 hours in dev

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

export async function backfillDeadRare() {
  // https://wallet-v20.mainnet.alephium.org/events/contract/xtUinNqtQyEnZHWqgbWVpvdJbZZTbywh6BM6iNkvEgCF?start=5328&limit=10
  // listed 5328, id: 3444

  // list block: 00000000000178fefc2fc36e677906de931f0d2faf0cf8d8b1aa06347f77aff0
  // sale block: 000000000001aa9eef9db632a2d7883aaa9f6694c532f181704baf1925ed1280

  //   const LIST_BLOCK =
  //     "00000000000178fefc2fc36e677906de931f0d2faf0cf8d8b1aa06347f77aff0" as BlockHash;
  //   const SALE_BLOCK =
  //     "000000000001aa9eef9db632a2d7883aaa9f6694c532f181704baf1925ed1280" as BlockHash;
  //   // do 1 by 1 and check results, it should all match with database
  //   // maybe take a small collection like shades of defi and track every event?

  //   //   const listBlock = await fetch(
  //   //     `${config.NODE_URL}/blockflow/blocks-with-events/${LIST_BLOCK}`,
  //   //     {
  //   //       method: "GET",
  //   //       headers: nodeHeaders,
  //   //     }
  //   //   ).then((a) => a.json());

  //   const blocks = await sdk.getBlocksFromHash([LIST_BLOCK, SALE_BLOCK]);

  let start = 0; // 6865 or 6800
  const limit = 100;
  let more = limit;
  while (more === limit) {
    const results = await fetchOrCallback(
      `e=>/events/contract/xtUinNqtQyEnZHWqgbWVpvdJbZZTbywh6BM6iNkvEgCF?start=${start}&limit=${limit}`,
      CACHE_TIME,
      async () => {
        return await fetch(
          `https://wallet-v20.mainnet.alephium.org/events/contract/xtUinNqtQyEnZHWqgbWVpvdJbZZTbywh6BM6iNkvEgCF?start=${start}&limit=${limit}`,
          {
            method: "GET",
            //   headers: nodeHeaders,
          }
        ).then((a) => a.json());
      }
    );

    const blocks = await fetchOrCallback(
      `blocks=>/events/contract/xtUinNqtQyEnZHWqgbWVpvdJbZZTbywh6BM6iNkvEgCF?start=${start}&limit=${limit}`,
      CACHE_TIME,
      async () => {
        const hashes = results.events.map((a) => a.blockHash);
        console.log({ prevStart: start, nextStart: results.nextStart });
        return await sdk.getBlocksFromHash(hashes);
      }
    );

    start = results.nextStart;
    more = new Set(results.events.map((a) => a.blockHash)).size;

    const result = await processBlocks("deadrare-marketplace", blocks, true);
    console.log(
      `Page ${start} => ${results.events.length}/${
        more === limit ? "more" : "done"
      }`
    );
  }
}

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
              .whereRef("Token.address", "=", "Balance.tokenAddress")
          )
        ),

        a.not(
          a.exists(
            a
              .selectFrom("Nft")
              .whereRef("Nft.address", "=", "Balance.tokenAddress")
          )
        ),
      ])
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
      }).then((a) => a.json())
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
            }
          ).then((a) => a.json())
      );
      if (subContractResponse.subContracts.length === 0) {
        break;
      }

      subContracts.push(...subContractResponse.subContracts);
      page++;
    } while (subContracts.length !== 0 && subContracts.length % limit === 0);

    // remove processed contracts
    unprocessed = unprocessed.filter((a) => !subContracts.includes(a));

    const responses = await fetchNftMetadata(parent.parent, subContracts);

    await processCollection(parent.parent);
    const updates = responses.map(
      (r) =>
        ({
          address: addressFromContractId(r.id),
          uri: r.tokenUri,
          collectionAddress: parent.parent,
          nftIndex: BigInt(r.nftIndex),
        } satisfies NftUpdate)
    );

    await db.transaction().execute(async (trx) => {
      const t = await bulkUpdateNft(updates, trx);
      console.log(
        `Finished processing collection ${t.length} Minted NFT's for this collection`
      );

      // TODO: check for existing tokens that are not in the DB
    });
    // console.log({ responses });
  }
}

async function loadMintedNfts(collectionAddress: ContractAddress) {
  const subs = await fetchOrCallback(
    `subcontracts-${collectionAddress}`,
    CACHE_TIME,
    async () => await sdk.fetchSubContracts(collectionAddress)
  );

  const tokens = await fetchNftMetadata(collectionAddress, subs);

  const holders = [];
  for (const token of tokens) {
    const holder = await fetchOrCallback(
      `holder-${token.id}`,
      CACHE_TIME,
      async () =>
        await sdk.fetchHolders(
          addressFromContractId(token.id) as ContractAddress
        )
    );

    if (holder.length) {
      holders.push({
        address: addressFromContractId(token.id),
        id: token.id,
        uri: token.tokenUri,
        nftIndex: BigInt(token.nftIndex),
        holder: holder[holder.length - 1],
      });
    }
  }

  return holders;
}

//yctRDyTBsTStMGYSqfe3hyGvmQ2wLj8swf1diP48mfGK
export async function processCollection(
  collectionAddress: ContractAddress,
  force = false
) {
  const exists = await db
    .selectFrom("NftCollection")
    .where("address", "=", collectionAddress)
    .executeTakeFirst();
  if (exists && !force) {
    console.log(`Collection ${collectionAddress} already exists, skipping`);
    return true;
  }
  const result = await fetchNftCollectionMetadata(collectionAddress);
  if (!result) {
    return false;
  }

  const uri = getCollectionUri(result.collection);
  if (!uri) {
    console.log(`Failed to find URI for ${collectionAddress}, skipping`);
    return false;
  }
  const collectionData = {
    address: collectionAddress,
    uri: uri,
    image: result.meta.image,
    name: result.meta.name,
    description: result.meta.description,
    raw: result.meta,
  } satisfies NewNftCollection;

  const minted = await loadMintedNfts(collectionAddress);

  const balances: NewBalance[] = [];
  const tokens: NewNft[] = [];
  for (const token of result.tokens) {
    const nftIndex = BigInt(token.nftIndex);
    const mint = minted.find((a) => a.nftIndex === nftIndex);
    if (mint) {
      balances.push({
        userAddress: mint.holder,
        tokenAddress: mint.address,
        balance: 1n,
      } satisfies NewBalance);
    }
    tokens.push({
      collectionAddress: collectionData.address,
      address: mint?.address ?? null, // fill in later
      tokenId: null, // fill in later
      nftIndex: nftIndex,
      name: token.name,
      image: token.image,
      description: token.description || "",
      uri: mint?.uri ?? `${collectionData.uri}/${token.nftIndex}`, // assumed deadrare format for now, will be fixed later
      raw: token,
    } satisfies NewNft);
  }

  await db.transaction().execute(async (trx) => {
    const insertedCollection = await trx
      .insertInto("NftCollection")
      .values(collectionData)
      .returningAll()
      .onConflict((col) => col.doNothing())
      .executeTakeFirst();

    const insertedTokens = await trx
      .insertInto("Nft")
      .values(tokens)
      .returningAll()
      .onConflict((col) =>
        col.columns(["collectionAddress", "nftIndex"]).doUpdateSet((eb) => ({
          address: eb.ref("excluded.address"),
          uri: eb.ref("excluded.uri"),
        }))
      )
      .execute();

    const attributes: NewNftAttribute[] = [];
    for (const token of insertedTokens) {
      try {
        const raw = token.raw;
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
      const chunks = chunkArray(attributes, 10_000);
      for (const chunk of chunks) {
        await trx.insertInto("NftAttribute").values(chunk).execute();
      }
    }

    if (balances.length) {
      await updateNftBalances(balances, trx);
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
  callback: () => Promise<unknown>
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

async function fetchNftMetadata(
  parent: ContractAddress,
  subContracts: string[]
) {
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
      `${config.EXPLORER_URL}/tokens/nft-metadata_${parent}_[${chunk}]`,
      CACHE_TIME,
      async () =>
        await fetch(`${config.EXPLORER_URL}/tokens/nft-metadata`, {
          headers: explorerHeaders,
          method: "POST",
          body: JSON.stringify(
            contractChunks[chunk].map((address) =>
              binToHex(contractIdFromAddress(address))
            )
          ),
        }).then((a) => a.json())
    );

    responses.push(...metadataResponse);
  }
  return responses;
}

async function fetchCollection(collectionAddress: ContractAddress) {
  interface CollectionInfo {
    collectionUri: string;
    totalSupply: `${number}`;
  }

  const [metadata]: CollectionInfo[] = await fetchOrCallback(
    `nft-${collectionAddress}`,
    CACHE_TIME,
    async () => {
      return await fetch(
        `${config.EXPLORER_URL}/tokens/nft-collection-metadata`,
        {
          method: "POST",
          headers: explorerHeaders,
          body: JSON.stringify([collectionAddress]),
        }
      ).then((a) => a.json());
    }
  );

  const state: NodeState = await fetchOrCallback(
    `state-${collectionAddress}`,
    CACHE_TIME,
    async () =>
      await sdk.fetchState(
        collectionAddress
        // NFTPublicSaleCollectionSequentialWithRoyaltyArtifact as unknown as Artifact,
      )
  );

  return {
    metadata,
    state,
  };
}

function getCollectionUri(
  collection: Awaited<ReturnType<typeof fetchCollection>>
) {
  if (collection.metadata?.collectionUri) {
    return collection.metadata.collectionUri;
  }

  try {
    //old deadrare i.e. shades-of-defi
    const state = sdk.parseState(
      collection.state,
      NFTPublicSaleCollectionSequentialWithRoyaltyArtifact as unknown as Artifact
    );
    const uri = state.fields.find((a) => a.name === "collectionUri")?.value;
    if (uri && typeof uri === "string") {
      return hexToString(uri);
    }
  } catch {}
}

async function fetchNftCollectionMetadata(collectionAddress: ContractAddress) {
  interface NFTInfo {
    image: string;
    name: string;
    description: string;
  }

  const collection = await fetchCollection(collectionAddress);
  if (!collection) {
    console.log("Failed to find collection, skipping");
    return;
  }

  const collectionUri = getCollectionUri(collection);
  if (!collectionUri) {
    console.log("Failed to find URI, skipping");
    return;
  }
  // const collectionUri =
  // 	collection.metadata.collectionUri ?? collection.state.find(a);

  const meta: NFTInfo = await fetchOrCallback(
    collectionUri,
    CACHE_TIME,
    async () => await fetch(collectionUri).then((a) => a.json())
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
        }
      ).then((a) => a.json());
    }
  );

  if (collectionAddress !== "22vxm543X8aEkqu31spuRGkaiNyN5hsmWaSP4o3c46tVd") {
    // try deadrare
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
        `${url}${url.endsWith("/") ? "" : "/"}${i}`
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
      const url = hexToString(state.mutFields[1].value);
      const one = await fetchOrCacheJson(
        `${url}${url.endsWith("/") ? "" : "/"}${i + 1}`
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
  alias: A
) {
  // Assume there's at least one record and all records
  // have the same keys.
  const keys = Object.keys(records[0]);

  // Transform the records into a list of lists such as
  // ($1, $2, $3), ($4, $5, $6)
  const values = sql.join(
    records.map((r) => sql`(${sql.join(keys.map((k) => r[k]))})`)
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
