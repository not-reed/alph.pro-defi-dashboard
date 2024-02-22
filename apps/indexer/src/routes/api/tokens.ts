import { type Env, type Schema } from "hono";
import { db } from "../../database/db";
import {
	addressFromContractId,
	binToHex,
	contractIdFromAddress,
} from "@alephium/web3";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { TokenSchema } from "../schemas/token";

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
