import { type Env, type Schema } from "hono";
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
						"verified",
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
			return {
				token: price.token
					? {
							id: binToHex(contractIdFromAddress(price.token.address)),
							...price.token,
					  }
					: null,
				price: price.markets[0].price, // TODO: calculate average based on liquidity
				markets: price.markets,
			};
		}),
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
