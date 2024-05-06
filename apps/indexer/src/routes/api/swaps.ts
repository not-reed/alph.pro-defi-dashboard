import { Hono, type Env, type Schema } from "hono";
import { db } from "../../database/db";
import { jsonObjectFrom } from "kysely/helpers/postgres";

const app = new Hono<Env, Schema, "/api/swaps">();

app.get("/", async (c) => {
  const swaps = await db
    .selectFrom("AyinSwap")
    .select((eb) => [
      "AyinSwap.userAddress",
      "AyinSwap.pairAddress",
      "AyinSwap.amount0",
      "AyinSwap.amount1",
      "AyinSwap.timestamp",
      "AyinSwap.transactionHash",
      jsonObjectFrom(
        eb
          .selectFrom("Pool")
          .innerJoin("AyinReserve", "Pool.pair", "AyinSwap.pairAddress")
          .select((eeb) => [
            "factory",
            "amount0",
            "amount1",
            "totalSupply",
            jsonObjectFrom(
              eeb
                .selectFrom("Token")
                .select([
                  "address",
                  "name",
                  "symbol",
                  "decimals",
                  "totalSupply",
                  "listed",
                  "description",
                  "logo",
                  (eeb) =>
                    jsonObjectFrom(
                      eeb
                        .selectFrom("Social")
                        .select([
                          "name",
                          "github",
                          "twitter",
                          "website",
                          "telegram",
                          "medium",
                          "discord",
                        ])
                        .whereRef("Token.socialId", "=", "Social.id")
                    ).as("social"),
                ])
                .whereRef("Token.address", "=", "Pool.pair")
            ).as("pair"),
            jsonObjectFrom(
              eeb
                .selectFrom("Token")
                .select([
                  "address",
                  "name",
                  "symbol",
                  "decimals",
                  "totalSupply",
                  "listed",
                  "description",
                  "logo",
                  (eeb) =>
                    eeb
                      .selectFrom("CurrentPrice")
                      .whereRef("Pool.token0", "=", "CurrentPrice.address")
                      .whereRef("sourceKey", "=", "Pool.pair")
                      .select("price")
                      .as("price"),
                  (eeb) =>
                    jsonObjectFrom(
                      eeb
                        .selectFrom("Social")
                        .select([
                          "name",
                          "github",
                          "twitter",
                          "website",
                          "telegram",
                          "medium",
                          "discord",
                        ])
                        .whereRef("Token.socialId", "=", "Social.id")
                    ).as("social"),
                ])
                .whereRef("Token.address", "=", "Pool.token0")
            ).as("token0"),
            jsonObjectFrom(
              eeb
                .selectFrom("Token")
                .select([
                  "address",
                  "name",
                  "symbol",
                  "decimals",
                  "totalSupply",
                  "listed",
                  "description",
                  "logo",
                  (eeb) =>
                    eeb
                      .selectFrom("CurrentPrice")
                      .whereRef("Pool.token1", "=", "CurrentPrice.address")
                      .whereRef("sourceKey", "=", "Pool.pair")
                      .select("price")
                      .as("price"),
                  (eeb) =>
                    jsonObjectFrom(
                      eeb
                        .selectFrom("Social")
                        .select([
                          "name",
                          "github",
                          "twitter",
                          "website",
                          "telegram",
                          "medium",
                          "discord",
                        ])
                        .whereRef("Token.socialId", "=", "Social.id")
                    ).as("social"),
                ])
                .whereRef("Token.address", "=", "Pool.token1")
            ).as("token1"),
          ])
          .whereRef("Pool.pair", "=", "AyinSwap.pairAddress")
          .limit(1)
      ).as("pool"),
    ])
    .orderBy("timestamp desc")
    .limit(15)
    .execute();
  return c.json({ swaps });
});


app.get("/liquidity", async (c) => {
    const swaps = await db
      .selectFrom("AyinLiquidityEvent")
      .select((eb) => [
        "AyinLiquidityEvent.userAddress",
        "AyinLiquidityEvent.pairAddress",
        "AyinLiquidityEvent.amount0",
        "AyinLiquidityEvent.amount1",
        "AyinLiquidityEvent.action",
        "AyinLiquidityEvent.liquidity",
        "AyinLiquidityEvent.timestamp",
        "AyinLiquidityEvent.transactionHash",
        jsonObjectFrom(
          eb
            .selectFrom("Pool")
            .innerJoin("AyinReserve", "Pool.pair", "AyinLiquidityEvent.pairAddress")
            .select((eeb) => [
              "factory",
              "amount0",
              "amount1",
              "totalSupply",
              jsonObjectFrom(
                eeb
                  .selectFrom("Token")
                  .select([
                    "address",
                    "name",
                    "symbol",
                    "decimals",
                    "totalSupply",
                    "listed",
                    "description",
                    "logo",
                    (eeb) =>
                      jsonObjectFrom(
                        eeb
                          .selectFrom("Social")
                          .select([
                            "name",
                            "github",
                            "twitter",
                            "website",
                            "telegram",
                            "medium",
                            "discord",
                          ])
                          .whereRef("Token.socialId", "=", "Social.id")
                      ).as("social"),
                  ])
                  .whereRef("Token.address", "=", "Pool.pair")
              ).as("pair"),
              jsonObjectFrom(
                eeb
                  .selectFrom("Token")
                  .select([
                    "address",
                    "name",
                    "symbol",
                    "decimals",
                    "totalSupply",
                    "listed",
                    "description",
                    "logo",
                    (eeb) =>
                      eeb
                        .selectFrom("CurrentPrice")
                        .whereRef("Pool.token0", "=", "CurrentPrice.address")
                        .whereRef("sourceKey", "=", "Pool.pair")
                        .select("price")
                        .as("price"),
                    (eeb) =>
                      jsonObjectFrom(
                        eeb
                          .selectFrom("Social")
                          .select([
                            "name",
                            "github",
                            "twitter",
                            "website",
                            "telegram",
                            "medium",
                            "discord",
                          ])
                          .whereRef("Token.socialId", "=", "Social.id")
                      ).as("social"),
                  ])
                  .whereRef("Token.address", "=", "Pool.token0")
              ).as("token0"),
              jsonObjectFrom(
                eeb
                  .selectFrom("Token")
                  .select([
                    "address",
                    "name",
                    "symbol",
                    "decimals",
                    "totalSupply",
                    "listed",
                    "description",
                    "logo",
                    (eeb) =>
                      eeb
                        .selectFrom("CurrentPrice")
                        .whereRef("Pool.token1", "=", "CurrentPrice.address")
                        .whereRef("sourceKey", "=", "Pool.pair")
                        .select("price")
                        .as("price"),
                    (eeb) =>
                      jsonObjectFrom(
                        eeb
                          .selectFrom("Social")
                          .select([
                            "name",
                            "github",
                            "twitter",
                            "website",
                            "telegram",
                            "medium",
                            "discord",
                          ])
                          .whereRef("Token.socialId", "=", "Social.id")
                      ).as("social"),
                  ])
                  .whereRef("Token.address", "=", "Pool.token1")
              ).as("token1"),
            ])
            .whereRef("Pool.pair", "=", "AyinLiquidityEvent.pairAddress")
            .limit(1)
        ).as("pool"),
      ])
      .where('AyinLiquidityEvent.pairAddress', '<>', 'uVYr7bR2P4oG5ZZHN9dodEk1Fk2czxaD1eFoiv6REcas')
      .orderBy("timestamp desc")
      .limit(25)
      .execute();
    return c.json({ swaps });
  });

export default app;
