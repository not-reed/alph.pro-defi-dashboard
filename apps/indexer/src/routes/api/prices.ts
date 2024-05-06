import type { Env, Schema } from "hono";
import { db } from "../../database/db";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

import { PriceSchema } from "../schemas/price";
import { binToHex, contractIdFromAddress } from "@alephium/web3";

const app = new OpenAPIHono<Env, Schema, "/api/balances">();

const route = createRoute({
	method: "get",
	tags: ["Prices"],
	path: "",
	request: {
		query: z.object({
			address: z
				.string()
				.min(10)
				.openapi({
					param: {
						name: "address",
						in: "query",
					},
					example: "tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq",
				}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						prices: z.array(PriceSchema),
					}),
				},
			},
			description: "Fetch token prices",
		},
	},
});

async function fetchCurrentPrices(addresses: string[]) {
	return await db
		.selectFrom("Token")
		.select((eb) => [
			jsonObjectFrom(
				eb
					.selectFrom("Token as t")
					.select([
						"address",
						"name",
						"symbol",
						"decimals",
						"totalSupply",
						"logo",
						"description",
						"listed",
					])
					.whereRef("Token.address", "=", "t.address"),
			).as("token"),
			jsonArrayFrom(
				eb
					.selectFrom("CurrentPrice")
					.select(["price", "liquidity", "source", "sourceKey", "timestamp"])
					.whereRef("Token.address", "=", "CurrentPrice.address"),
			).as("markets"),
		])
		.where("Token.address", "in", addresses)
		.execute();
}

app.openapi(route, async (c) => {
	const { address } = c.req.valid("query");
	const prices = await fetchCurrentPrices(address?.split(","));
	return c.json({
		prices: prices.map((price) => {
			const mostLiquidMarket = price.markets
				.filter((a) => a.source === "ayin")
				.reduce(
					(a, b) => {
						if (a.liquidity === b.liquidity) {
							return BigInt(a.price || 0) > BigInt(b.price || 0) ? a : b;
						}
						if (!a.liquidity) return b;
						if (!b.liquidity) return a;

						return a.liquidity > b.liquidity ? a : b;
					},
					{ liquidity: null, price: null } as Pick<
						(typeof price.markets)[number],
						"liquidity" | "price"
					>,
				);

			const coinGecko = price.markets.find((a) => a.source === "coingecko");

			const lowLiquidity =
				(mostLiquidMarket.liquidity &&
					mostLiquidMarket.liquidity <
						10_000n * 10n ** BigInt(price.token?.decimals ?? 18)) ||
				!mostLiquidMarket.liquidity;

			const bestPrice =
				lowLiquidity && coinGecko ? coinGecko : mostLiquidMarket;

			return {
				token: price.token
					? {
							id: binToHex(contractIdFromAddress(price.token.address)),
							...price.token,
					  }
					: null,
				price: BigInt(bestPrice?.price || 0), // TODO: calculate average based on liquidity
				markets: price.markets.map((a) => ({
					...a,
					price: BigInt(a.price || 0),
					liquidity: a.liquidity ? BigInt(a.liquidity) : null,
				})),
			};
		}),
	});
});
import { env } from "hono/adapter";
app.get("/fiat", async (c) => {
	console.log({ env: env(c)["AUTH_URL"] });
	return c.json({
		currency: await db
			.selectFrom("FiatExchange")
			.select(["code", "rate"])
			.execute(),
	});
});

app.doc("/docs.json", {
	info: {
		title: "Alph.Pro Indexer API",
		version: "v1",
	},
	openapi: "3.1.0",
});

export default app;
