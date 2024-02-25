import { type Env, type Schema } from "hono";
import { db } from "../../database/db";
import {
	addressFromContractId,
	binToHex,
	contractIdFromAddress,
} from "@alephium/web3";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { TokenSchema } from "../schemas/token";
import { sql } from "kysely";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

const app = new OpenAPIHono<Env, Schema, "/api/tokens">();

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
	// @ts-expect-error TODO: why does this error
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

app.get("/address/:address", async (c) => {
	const { address } = c.req.param();
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

app.get("/holders", async (c) => {
	// const { address } = c.req.param();
	const holders = await db
		.selectFrom("Balance")
		.select((eb) => [
			eb.fn.count("Balance.userAddress").as("holderCount"),
			eb.fn.sum("Balance.balance").as("circulatingSupply"),
			jsonObjectFrom(
				eb
					.selectFrom("Token")
					.selectAll()
					.whereRef("Token.address", "=", "Balance.tokenAddress"),
			).as("token"),
		])
		.groupBy("Balance.tokenAddress")
		.orderBy("holderCount", "desc")
		.execute();

	return c.json({
		holders,
	});
});

app.get("/holders/:address", async (c) => {
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
					.whereRef("Token.address", "=", "Balance.tokenAddress"),
			).as("token"),
			jsonArrayFrom(
				eb
					.selectFrom("Balance")
					.select(["balance", "userAddress"])
					.where("Balance.tokenAddress", "=", address)
					.orderBy("balance", "desc")
					.limit(100),
			).as("holders"),
		])
		.where("Balance.tokenAddress", "=", address)
		.groupBy("Balance.tokenAddress")
		.orderBy("holderCount", "desc")
		.execute();

	return c.json({
		holders: holders.map((h) => {
			return {
				...h,
				holders: h.holders.map((h) => {
					return {
						balance: BigInt(h.balance),
						userAddress: h.userAddress,
					};
				}),
			};
		}),
	});
});

app.get("/symbol/:symbol", async (c) => {
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

app.get("/id/:id", async (c) => {
	const { id } = c.req.param();
	const address = addressFromContractId(id);
	const tokens = await db
		.selectFrom("Token")
		.selectAll()
		.where("address", "=", address)
		.execute();

	return c.json({ tokens });
});

app.doc("/docs.json", {
	info: {
		title: "Alph.Pro Indexer API",
		version: "v2",
	},
	openapi: "3.1.0",
});

export default app;
