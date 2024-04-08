import type { Env, Schema } from "hono";
import { db } from "../../database/db";
import { binToHex, contractIdFromAddress } from "@alephium/web3";
import { jsonObjectFrom } from "kysely/helpers/postgres";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { TokenSchema } from "../schemas/token";

const app = new OpenAPIHono<Env, Schema, "/api/pools">();

app.doc("/docs.json", {
	info: {
		title: "Alph.Pro Indexer API",
		version: "v2",
	},
	openapi: "3.1.0",
});
const poolsRoute = createRoute({
	method: "get",
	tags: ["Pools"],
	path: "",
	request: {},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						pools: z.array(
							z.object({
								factory: z.string(),
								amount0: z.string().nullable(),
								amount1: z.string().nullable(),
								totalSupply: z.string().nullable(),
								pair: TokenSchema,
								token0: TokenSchema,
								token1: TokenSchema,
							}),
						),
					}),
				},
			},
			description: "Fetch matching tokens",
		},
	},
});

app.openapi(poolsRoute, async (c) => {
	const pools = await db
		.selectFrom("Pool")
		.select(["Pool.factory"])
		// .select(["Pool.factory", "Pool.pair as pairAddress"]) // TODO: why/how did token indexer miss some pools
		.select((eb) => [
			jsonObjectFrom(
				eb
					.selectFrom("Token")
					.select([
						"address",
						"name",
						"symbol",
						"decimals",
						"totalSupply",
						"description",
						"logo",
						"listed",
					])
					.whereRef("Token.address", "=", "Pool.pair"),
			).as("pair"),
			jsonObjectFrom(
				eb
					.selectFrom("Token")
					.select([
						"address",
						"name",
						"symbol",
						"decimals",
						"totalSupply",
						"description",
						"logo",
						"listed",
					])
					.whereRef("Token.address", "=", "Pool.token0"),
			).as("token0"),
			jsonObjectFrom(
				eb
					.selectFrom("Token")
					.select([
						"address",
						"name",
						"symbol",
						"decimals",
						"totalSupply",
						"description",
						"logo",
						"listed",
					])
					.whereRef("Token.address", "=", "Pool.token1"),
			).as("token1"),
		])
		.leftJoin("AyinReserve", (join) =>
			join.onRef("AyinReserve.pairAddress", "=", "Pool.pair"),
		)
		.select([
			"AyinReserve.amount0",
			"AyinReserve.amount1",
			"AyinReserve.totalSupply",
		])
		.where((qb) => {
			// return qb.not(
			return qb.exists(
				qb
					.selectFrom("Token")
					.select("Token.id")
					.whereRef("Token.address", "=", "Pool.pair"),
				// ),
			);
		})
		.execute();

	return c.json({
		pools: pools.map((t) => {
			const pair = t.pair
				? {
						...t.pair,
						id: binToHex(contractIdFromAddress(t.pair.address)),
				  }
				: null;

			const token0 = t.token0
				? {
						...t.token0,
						id: binToHex(contractIdFromAddress(t.token0.address)),
				  }
				: null;

			const token1 = t.token1
				? {
						...t.token1,
						id: binToHex(contractIdFromAddress(t.token1.address)),
				  }
				: null;
			return {
				...t,
				id: binToHex(contractIdFromAddress(t.factory)),
				pair,
				token0,
				token1,
			};
		}),
	});
});

export default app;
