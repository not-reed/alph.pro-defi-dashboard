import type { Env, Schema } from "hono";

import { db } from "../../database/db";
import { binToHex, contractIdFromAddress } from "@alephium/web3";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";
import { sql } from "kysely";
import type { NewSocial } from "../../database/schemas/public/Social";

const app = new OpenAPIHono<Env, Schema, "/api/nfts">();

app.doc("/docs.json", {
  info: {
    title: "Alph.Pro Indexer API",
    version: "v2",
  },
  openapi: "3.1.0",
});

const nftRoute = createRoute({
  method: "get",
  tags: ["NFTs"],
  path: "",
  request: {},
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            nfts: z.array(
              z.object({
                id: z.string(),
                address: z.string(),
                name: z.string(),
                description: z.string(),
                image: z.string(),
                uri: z.string(),
                stats: z.object({
                  floor: z.string(),
                  volume: z.string(),
                  holderCount: z.string(),
                  mintedCount: z.string(),
                  listedCount: z.string(),
                }),
                // token: TokenSchema,
              })
            ),
          }),
        },
      },
      description: "Retrieve the user",
    },
  },
});

app.openapi(nftRoute, async (c) => {
  const holders = await db
    .selectFrom("NftCollection")
    .select([
      "NftCollection.address",
      "NftCollection.description",
      "NftCollection.image",
      "NftCollection.uri",
      "NftCollection.listed",
      "NftCollection.name",
    ])
    .leftJoin(
      (eb) =>
        eb
          .selectFrom("Nft")
          .select([
            sql<string>`count(distinct coalesce("seller", "Balance"."userAddress"))`.as(
              "holderCount"
            ),
            sql<string>`count(seller)`.as("listedCount"),
            sql<string>`count(distinct address)`.as("mintedCount"),
            "Nft.collectionAddress",
          ])
          .leftJoin("Balance", (join) =>
            join.onRef("Nft.address", "=", "Balance.tokenAddress")
          )
          .leftJoin("DeadRareListing", (join) =>
            join
              .onRef(
                "DeadRareListing.tokenAddress",
                "=",
                "Balance.tokenAddress"
              )
              .on("soldAt", "is", null)
              .on("unlistedAt", "is", null)
          )
          .where("balance", "<>", 0n)
          .groupBy("Nft.collectionAddress")
          .as("Nft"),
      (join) =>
        join.onRef("NftCollection.address", "=", "Nft.collectionAddress")
    )
    .leftJoinLateral(
      (eb) =>
        eb
          .selectFrom("DeadRareListing")
          .select(({ fn }) => fn.min("price").as("floor"))
          .whereRef(
            "DeadRareListing.collectionAddress",
            "=",
            "NftCollection.address"
          )
          .where("soldAt", "is", null)
          .where("unlistedAt", "is", null)
          .as("floor"),
      (join) => join.onTrue()
    )
    .leftJoinLateral(
      (eb) =>
        eb
          .selectFrom("DeadRareListing")
          .select(({ fn }) => fn.sum("price").as("volume"))
          .whereRef(
            "DeadRareListing.collectionAddress",
            "=",
            "NftCollection.address"
          )
          .where("buyer", "is not", null)
          .as("volume"),
      (join) => join.onTrue()
    )
    .select(["holderCount", "mintedCount", "listedCount", "floor", "volume"])
    .orderBy("holderCount", "desc")
    .execute();

  return c.json({
    nfts: holders.map((h) => {
      return {
        id: binToHex(contractIdFromAddress(h.address)),
        address: h.address,
        name: h.name,
        description: h.description,
        image: h.image,
        uri: h.uri,
        listed: h.listed,
        stats: {
          holderCount: h.holderCount?.toString() || "0",
          mintedCount: h.mintedCount?.toString() || "0",
          listedCount: h.listedCount?.toString() || "0",
          floor: h.floor?.toString() || "0",
          volume: h.volume?.toString() || "0",
        },
      };
    }),
  });
});

const holdersRoute = createRoute({
  method: "get",
  tags: ["NFTs"],
  path: "/holders",
  request: {},
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            holders: z.array(
              z.object({
                id: z.string(),
                address: z.string(),
                name: z.string(),
                description: z.string(),
                image: z.string(),
                uri: z.string(),
                stats: z.object({
                  floor: z.string(),
                  volume: z.string(),
                  holderCount: z.string(),
                  mintedCount: z.string(),
                  listedCount: z.string(),
                }),
              })
            ),
          }),
        },
      },
      description: "Fetch matching tokens",
    },
  },
});

app.openapi(holdersRoute, async (c) => {
  const holders = await db
    .selectFrom("NftCollection")
    .select([
      "NftCollection.address",
      "NftCollection.description",
      "NftCollection.image",
      "NftCollection.uri",
      "NftCollection.name",
    ])
    .leftJoin(
      (eb) =>
        eb
          .selectFrom("Nft")
          .select([
            sql<string>`count(distinct coalesce("seller", "Balance"."userAddress"))`.as(
              "holderCount"
            ),
            sql<string>`count(seller)`.as("listedCount"),
            sql<string>`count(distinct address)`.as("mintedCount"),
            "Nft.collectionAddress",
          ])
          .leftJoin("Balance", (join) =>
            join.onRef("Nft.address", "=", "Balance.tokenAddress")
          )
          .leftJoin("DeadRareListing", (join) =>
            join
              .onRef(
                "DeadRareListing.tokenAddress",
                "=",
                "Balance.tokenAddress"
              )
              .on("soldAt", "is", null)
              .on("unlistedAt", "is", null)
          )
          .where("balance", "<>", 0n)
          .groupBy("Nft.collectionAddress")
          .as("Nft"),
      (join) =>
        join.onRef("NftCollection.address", "=", "Nft.collectionAddress")
    )
    .leftJoinLateral(
      (eb) =>
        eb
          .selectFrom("DeadRareListing")
          .select(({ fn }) => fn.min("price").as("floor"))
          .whereRef(
            "DeadRareListing.collectionAddress",
            "=",
            "NftCollection.address"
          )
          .where("soldAt", "is", null)
          .where("unlistedAt", "is", null)
          .as("floor"),
      (join) => join.onTrue()
    )
    .leftJoinLateral(
      (eb) =>
        eb
          .selectFrom("DeadRareListing")
          .select(({ fn }) => fn.sum("price").as("volume"))
          .whereRef(
            "DeadRareListing.collectionAddress",
            "=",
            "NftCollection.address"
          )
          .where("buyer", "is not", null)
          .as("volume"),
      (join) => join.onTrue()
    )
    .select(["holderCount", "mintedCount", "listedCount", "floor", "volume"])
    .orderBy("holderCount", "desc")
    .execute();

  return c.json({
    holders: holders.map((h) => {
      return {
        id: binToHex(contractIdFromAddress(h.address)),
        address: h.address,
        name: h.name,
        description: h.description,
        image: h.image,
        uri: h.uri,
        /** @deprecated */
        holderCount: h.holderCount || "0",
        stats: {
          holderCount: h.holderCount?.toString() || "0",
          mintedCount: h.mintedCount?.toString() || "0",
          listedCount: h.listedCount?.toString() || "0",
          floor: h.floor?.toString() || "0",
          volume: h.volume?.toString() || "0",
        },
      };
    }),
  });
});

const holdersAddressRoute = createRoute({
  method: "get",
  tags: ["NFTs"],
  path: "/holders/{address}",
  request: {
    params: z.object({
      address: z.string().openapi({
        param: { name: "address", in: "path" },
        example: "22W9Xqz3BZE9fsCEtgqsk6CTRHktF2tFYb5wc1RWWCa8X",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            holders: z.array(
              z.object({
                holderCount: z.string().openapi({ example: "10000" }),
                circulatingSupply: z.string().openapi({ example: "1000000" }),
                holders: z.array(
                  z
                    .object({
                      userAddress: z.string().openapi({
                        example:
                          "17CtvwRZsaAhDjVLDm1YWNigKDETZbpcwqbrSkSsnV3XH",
                      }),
                      balance: z.string().openapi({ example: "1000000" }),
                    })
                    .openapi("Holder")
                ),
              })
            ),
          }),
        },
      },
      description: "Fetch matching tokens",
    },
  },
});

app.openapi(holdersAddressRoute, async (c) => {
  const { address } = c.req.param();
  const holders = await db
    .selectFrom("NftCollection")
    .selectAll()
    .select((eb) => [
      eb
        .selectFrom("Nft")
        .leftJoin("Balance", (join) =>
          join.onRef("Nft.address", "=", "Balance.tokenAddress")
        )
        .select([
          sql<string>`count(distinct "Balance"."userAddress")`.as(
            "holderCount"
          ),
        ])
        .where("Balance.balance", "<>", 0n)
        .whereRef("Nft.collectionAddress", "=", "NftCollection.address")
        .as("holderCount"),

      eb
        .selectFrom("Nft")
        .leftJoin("Balance", (join) =>
          join.onRef("Nft.address", "=", "Balance.tokenAddress")
        )
        .select([
          sql<string>`count(distinct "Balance"."tokenAddress")`.as(
            "circulatingSupply"
          ),
        ])
        .where("Balance.balance", "<>", 0n)
        .whereRef("Nft.collectionAddress", "=", "NftCollection.address")
        .as("circulatingSupply"),

      jsonObjectFrom(
        eb
          .selectFrom("Social")
          .selectAll()
          .whereRef("Social.id", "=", "NftCollection.socialId")
          .limit(1)
      ).as("social"),

      jsonArrayFrom(
        eb
          .selectFrom("Nft")
          .leftJoin("Balance", (join) =>
            join.onRef("Nft.address", "=", "Balance.tokenAddress")
          )
          .select([
            "Balance.userAddress",
            "Nft.address",
            "Nft.image",
            "Nft.name",
            "Nft.nftIndex",
            "Nft.description",
            "Nft.uri",
          ])
          .where("Balance.balance", "<>", 0n)
          .whereRef("Nft.collectionAddress", "=", "NftCollection.address")
          .orderBy("userAddress")
      ).as("holders"),
    ])
    .where("NftCollection.address", "=", address)
    .execute();

  return c.json({
    holders: holders.map((h) => {
      return {
        id: binToHex(contractIdFromAddress(h.address)),
        address: h.address,
        name: h.name,
        description: h.description,
        image: h.image,
        uri: h.uri,
        holderCount: h.holderCount || "0",
        circulatingSupply: h.circulatingSupply || "0",
        social:
          h.social ??
          ({
            name: null,
            github: null,
            twitter: null,
            discord: null,
            website: null,
            telegram: null,
            medium: null,
          } satisfies NewSocial),
        holders: h.holders.reduce((acc, h) => {
          if (!h.userAddress || !h.address) {
            return acc;
          }
          return acc.concat({
            userAddress: h.userAddress,
            address: h.address,
            id: binToHex(contractIdFromAddress(h.address)),
            image: h.image,
            name: h.name,
            nftIndex: h.nftIndex,
            description: h.description,
            uri: h.uri,
          });
        }, [] as unknown[]),
      };
    }),
    // holders: holders.reduce((acc, h) => {
    // 	if (!h.token?.address) {
    // 		return acc;
    // 	}
    // 	return acc.concat({
    // 		...h,
    // 		token: {
    // 			...h.token,
    // 			id: binToHex(contractIdFromAddress(h.token.address)),
    // 		},
    // 		holders: h.holders.map((h) => {
    // 			return {
    // 				balance: BigInt(h.balance),
    // 				userAddress: h.userAddress,
    // 			};
    // 		}),
    // 	});
    // }, [] as unknown[]),
  });
});

const nftSingleByIdxRoute = createRoute({
  method: "get",
  tags: ["NFTs"],
  path: "/by-index/{address}/{idx}",
  request: {
    params: z.object({
      address: z.string().openapi({
        param: { name: "address", in: "path" },
        example: "22W9Xqz3BZE9fsCEtgqsk6CTRHktF2tFYb5wc1RWWCa8X",
      }),
      idx: z.coerce.number().openapi({
        param: { name: "idx", in: "path" },
        example: 1,
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            owner: z.string(),
            nft: z
              .object({
                address: z.string(),
                collectionAddress: z.string(),
                description: z.string(),
                id: z.string(),
                image: z.string(),
                name: z.string(),
                nftIndex: z.string(),
                uri: z.string(),
              })
              .openapi("Nft"),
          }),
        },
      },
      description: "Retrieve the user",
    },
  },
});

app.openapi(nftSingleByIdxRoute, async (c) => {
  const { address, idx } = c.req.param();

  const nft = await db
    .selectFrom("Nft")
    .selectAll()
    .where("collectionAddress", "=", address)
    .where("nftIndex", "=", BigInt(idx))
    .executeTakeFirstOrThrow();

  const owner = await db
    .selectFrom("Balance")
    .selectAll()
    .where("tokenAddress", "=", nft.address)
    .where("balance", "=", 1n)
    .executeTakeFirstOrThrow();
  return c.json({
    owner: owner.userAddress,
    nft: {
      address: nft.address || "",
      collectionAddress: nft.collectionAddress,
      description: nft.description,
      id: binToHex(contractIdFromAddress(nft.address as string)),
      image: nft.image,
      name: nft.name,
      nftIndex: nft.nftIndex.toString(),
      uri: nft.uri,
    },
  });
});

const nftSingleRoute = createRoute({
  method: "get",
  tags: ["NFTs"],
  path: "/{address}",
  request: {
    params: z.object({
      address: z.string().openapi({
        param: { name: "address", in: "path" },
        example: "22W9Xqz3BZE9fsCEtgqsk6CTRHktF2tFYb5wc1RWWCa8X",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            nft: z
              .object({
                id: z.string(),
                address: z.string(),
                name: z.string(),
                description: z.string(),
                image: z.string(),
              })
              .openapi("Nft"),
          }),
        },
      },
      description: "Retrieve the user",
    },
  },
});

app.openapi(nftSingleRoute, async (c) => {
  const { address } = c.req.valid("param");

  const nft = await db
    .selectFrom("NftCollection")
    .selectAll()
    .where("address", "=", address)
    .executeTakeFirstOrThrow();
  return c.json({
    nft: {
      id: binToHex(contractIdFromAddress(nft.address)),
      address: nft.address,
      image: nft.image,
      name: nft.name,
      description: nft.description,
    },
  });
});

export default app;
