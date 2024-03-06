import { type Env, type Schema } from "hono";
import { db } from "../../database/db";
import {
	addressFromContractId,
	binToHex,
	contractIdFromAddress,
} from "@alephium/web3";
import { jsonObjectFrom } from "kysely/helpers/postgres";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { TokenSchema } from "../schemas/token";

const app = new OpenAPIHono<Env, Schema, "/api/utils">();

app.doc("/docs.json", {
	info: {
		title: "Alph.Pro Indexer API",
		version: "v2",
	},
	openapi: "3.1.0",
});
const addressToId = createRoute({
	method: "get",
	tags: ["Utils"],
	path: "/convert",
	request: {
		query: z.object({
			address: z.string().optional(),
			id: z.string().optional(),
		}),
	},
	responses: {
		200: {
			content: {
				/** Skipped */
			},
			description: "converts an addressed and ids",
		},
	},
});

app.openapi(addressToId, async (c) => {
	const { address, id } = c.req.valid("query");
	const response: Record<string, { address: string; id: string }> = {};
	for (const a of address?.split(",") ?? []) {
		try {
			response[a] = {
				address: a,
				id: binToHex(contractIdFromAddress(a)),
			};
		} catch {
			response[a] = {
				address: a,
				id: "invalid",
			};
		}
	}
	for (const a of id?.split(",") ?? []) {
		try {
			response[a] = {
				address: addressFromContractId(a),
				id: a,
			};
		} catch {
			response[a] = {
				address: "invalid",
				id: a,
			};
		}
	}

	return c.json(response);
});

export default app;
