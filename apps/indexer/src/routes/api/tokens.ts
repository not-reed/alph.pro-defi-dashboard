import { type Env, type Schema } from "hono";
import { db } from "../../database/db";
import {
  addressFromContractId,
  binToHex,
  contractIdFromAddress,
} from "@alephium/web3";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { TokenSchema } from "../schemas/token";

import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

const app = new OpenAPIHono<Env, Schema, "/api/tokens">();

app.doc("/docs.json", {
  info: {
    title: "Alph.Pro Indexer API",
    version: "v2",
  },
  openapi: "3.1.0",
});

const route = createRoute({
  method: "get",
  tags: ["Tokens"],
  path: "",
  request: {
    query: z.object({
      verified: z.coerce.boolean().openapi({
        param: { name: "verified", in: "query" },
        example: true,
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            tokens: z.array(TokenSchema),
          }),
        },
      },
      description: "Fetch all tokens",
    },
  },
});

app.openapi(route, async (c) => {
  const { verified } = c.req.valid("query");

  const tokens = await db
    .selectFrom("Token")
    .selectAll()
    .where("verified", "in", verified ? [true] : [true, false])
    .execute();

  return c.json({
    tokens: tokens.map((t) => {
      return {
        ...t,
        id: binToHex(contractIdFromAddress(t.address)),
      };
    }),
  });
});

const addressRoute = createRoute({
  method: "get",
  tags: ["Tokens"],
  path: "/address/{address}",
  request: {
    params: z.object({
      address: z.string().openapi({
        param: { name: "address", in: "path" },
        example: "tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            tokens: z.array(TokenSchema),
          }),
        },
      },
      description: "Fetch matching tokens",
    },
  },
});
app.openapi(addressRoute, async (c) => {
  const { address } = c.req.valid("param");
  console.log({ address });
  const tokens = await db
    .selectFrom("Token")
    .selectAll()
    .where("address", "=", address)
    .execute();

  return c.json({
    tokens: tokens.map((t) => {
      return {
        ...t,
        id: binToHex(contractIdFromAddress(t.address)),
      };
    }),
  });
});

const symbolRoute = createRoute({
  method: "get",
  tags: ["Tokens"],
  path: "/symbol/{symbol}",
  request: {
    params: z.object({
      symbol: z.string().openapi({
        param: { name: "symbol", in: "path" },
        example: "alph",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            tokens: z.array(TokenSchema),
          }),
        },
      },
      description: "Fetch matching tokens",
    },
  },
});
app.openapi(symbolRoute, async (c) => {
  const { symbol } = c.req.param();
  const tokens = await db
    .selectFrom("Token")
    .selectAll()
    .where("symbol", "ilike", symbol)
    .orderBy("verified", "desc")
    .execute();

  return c.json({
    tokens: tokens.map((t) => {
      return {
        ...t,
        id: binToHex(contractIdFromAddress(t.address)),
      };
    }),
  });
});
const idRoute = createRoute({
  method: "get",
  tags: ["Tokens"],
  path: "/id/{id}",
  request: {
    params: z.object({
      id: z.string().openapi({
        param: { name: "id", in: "path" },
        example:
          "0000000000000000000000000000000000000000000000000000000000000000",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            tokens: z.array(TokenSchema),
          }),
        },
      },
      description: "Fetch matching tokens",
    },
  },
});
app.openapi(idRoute, async (c) => {
  const { id } = c.req.param();
  const address = addressFromContractId(id);
  const tokens = await db
    .selectFrom("Token")
    .selectAll()
    .where("address", "=", address)
    .execute();

  return c.json({ tokens });
});

const holdersRoute = createRoute({
  method: "get",
  tags: ["Tokens"],
  path: "/holders",
  request: {},
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            holders: z.array(
              z.object({
                holderCount: z.number().openapi({ example: 10000 }),
                circulatingSupply: z.number().openapi({ example: 1000000 }),
                token: TokenSchema,
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
    .selectFrom("Balance")
    .select((eb) => [
      eb.fn.count("Balance.userAddress").as("holderCount"),
      eb.fn.sum("Balance.balance").as("circulatingSupply"),
      jsonObjectFrom(
        eb
          .selectFrom("Token")
          .selectAll()
          .whereRef("Token.address", "=", "Balance.tokenAddress")
      ).as("token"),
    ])
    .where("balance", "<>", 0n)
    .whereRef("Balance.tokenAddress", "<>", "Balance.userAddress")
    .groupBy("Balance.tokenAddress")
    .orderBy("holderCount", "desc")
    .execute();

  return c.json({
    holders: holders.reduce((acc, h) => {
      if (!h.token?.address) {
        return acc;
      }
      return acc.concat({
        holderCount: h.holderCount,
        circulatingSupply: h.circulatingSupply,
        token: {
          ...h.token,
          id: binToHex(contractIdFromAddress(h.token.address)),
        },
      });
    }, [] as unknown[]),
  });
});

const holdersAddressRoute = createRoute({
  method: "get",
  tags: ["Tokens"],
  path: "/holders/{address}",
  request: {
    params: z.object({
      address: z.string().openapi({
        param: { name: "address", in: "path" },
        example: "tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq",
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
                holderCount: z.number().openapi({ example: 10000 }),
                circulatingSupply: z.number().openapi({ example: 1000000 }),
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
    .selectFrom("Balance")
    .select((eb) => [
      eb.fn.count("Balance.userAddress").as("holderCount"),
      eb.fn.sum("Balance.balance").as("circulatingSupply"),
      jsonObjectFrom(
        eb
          .selectFrom("Token")
          .selectAll()
          .whereRef("Token.address", "=", "Balance.tokenAddress")
      ).as("token"),
      jsonArrayFrom(
        eb
          .selectFrom("Balance as holders")
          .select(["balance", "userAddress"])
          .where("holders.tokenAddress", "=", address)
          .where("holders.balance", "<>", 0n)
          .whereRef("holders.tokenAddress", "<>", "holders.userAddress")
          .orderBy("balance", "desc")
          .limit(2000)
      ).as("holders"),
    ])
    .where("Balance.tokenAddress", "=", address)
    .where("balance", "<>", 0n)
    .whereRef("Balance.tokenAddress", "<>", "Balance.userAddress")
    .groupBy("Balance.tokenAddress")
    .orderBy("holderCount", "desc")
    .execute();

  return c.json({
    holders: holders.reduce((acc, h) => {
      if (!h.token?.address) {
        return acc;
      }
      return acc.concat({
        ...h,
        token: {
          ...h.token,
          id: binToHex(contractIdFromAddress(h.token.address)),
        },
        holders: h.holders.map((h) => {
          return {
            balance: BigInt(h.balance),
            userAddress: h.userAddress,
          };
        }),
      });
    }, [] as unknown[]),
  });
});

export default app;
