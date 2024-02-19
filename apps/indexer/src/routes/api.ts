import { type Env, Hono, type Schema } from "hono";
import { cors } from "hono/cors";
import { type Swagger } from "atlassian-openapi";
// indexer routes
import status from "./api/status";
import sse from "./api/sse";

// user API routes
import tokens from "./api/tokens";
import pools from "./api/pools";
import balances from "./api/balances";
import { swaggerUI } from "@hono/swagger-ui";
import { isErrorResult, merge } from "openapi-merge";
import type {
	SingleMergeInput,
	SingleMergeInputV2,
} from "openapi-merge/dist/data";
import { logger } from "../services/logger";

const app = new Hono<Env, Schema, "/api">();

app.route("/status", status);
app.route("/sse", sse);

app.get("/docs.json", async (c) => {
	const base = new URL(c.req.url).origin;

	const [balances, tokens] = (await Promise.all([
		// TODO: include public routes here
		fetch(`${base}/api/balances/docs.json`).then((a) => a.json()),
		fetch(`${base}/api/tokens/docs.json`).then((a) => a.json()),
	])) as unknown as Swagger.SwaggerV3[];

	const mergeResult = merge([
		{
			oas: balances,
			description: { append: true, title: { value: "Balances" } },
			pathModification: { prepend: "/api/balances" },
		},
		{
			oas: tokens,
			description: { append: true, title: { value: "Tokens" } },
			pathModification: { prepend: "/api/tokens" },
		},
	]);

	if (isErrorResult(mergeResult)) {
		logger.error(`${mergeResult.message} (${mergeResult.type})`);
		return c.json({
			info: {
				title: "Alph.Pro Indexer API",
				version: "v1",
				description: "An error occured loading the scemas",
			},
			openapi: "3.1.0",
			components: { schemas: {} },
			paths: {},
		} satisfies Swagger.SwaggerV3);
	}

	return c.json(mergeResult.output);
});
app.get("/docs", swaggerUI({ url: "/api/docs.json" }));

const corsOptions = cors({
	origin: "http://localhost:5173", // TODO: change to env, this is front end vite
	allowHeaders: ["X-Custom-Header", "Upgrade-Insecure-Requests"],
	allowMethods: ["POST", "GET", "OPTIONS"],
	exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
	maxAge: 600,
	credentials: true,
});
app.use("/balances/*", corsOptions);

// User Api
app.route("/tokens", tokens);
app.route("/pools", pools);
app.route("/balances", balances);

export default app;
