import { Hono, type Schema } from "hono";
import { cors } from "hono/cors";
import type { Swagger } from "atlassian-openapi";
import { SwaggerUI, swaggerUI } from "@hono/swagger-ui";
import { isErrorResult, merge, type MergeInput } from "openapi-merge";
import { logger } from "../services/logger";
import type { AuthUser, AuthConfig } from "@hono/auth-js";

// indexer routes
import status from "./api/status";
import sse from "./api/sse";

// user API routes
import tokens from "./api/tokens";
import pools from "./api/pools";
import balances from "./api/balances";
import V2Balances from "./api/v2/balances";
import prices from "./api/prices";
import auth from "./api/auth";
import nfts from "./api/nfts";
import wallets from "./api/wallets";
import web3 from "./api/web3";
import utils from "./api/utils";
import swaps from "./api/swaps";
import bot from "./api/bot";
import {
	trimTrailingSlash,
  } from 'hono/trailing-slash'

const app = new Hono<
	{ Variables: { authUser: AuthUser; authConfig: AuthConfig } },
	Schema,
	"/api"
>();

app.use(trimTrailingSlash())
app.route("/status", status);
app.route("/sse", sse);

app.get("/docs.json", async (c) => {
	const base = new URL(c.req.url).origin;

	const publicDocs = {
		Balances: "/api/balances",
		V2Balances: "/api/v2/balances",
		Nfts: "/api/nfts",
		Pools: "/api/pools",
		Prices: "/api/prices",
		Tokens: "/api/tokens",
		Utils: "/api/utils",
	};

	const mergeResult = await loadChildDocuments(base, publicDocs);

	if (isErrorResult(mergeResult)) {
		logger.error(`${mergeResult.message} (${mergeResult.type})`);
		return c.json({
			info: {
				title: "Alph.Pro Indexer API",
				version: "v1",
				description: "An error occurred loading the schemas",
			},
			openapi: "3.1.0",
			paths: Object.fromEntries(
				Object.entries(publicDocs).map(([key, path]) => [
					`${path}/docs.json`,
					{
						get: { summary: `Failed to load ${key}`, responses: {} },
					} satisfies Swagger.SwaggerV3["paths"][number],
				]),
			),
		} satisfies Swagger.SwaggerV3);
	}

	return c.json(mergeResult.output);
});
app.get("/docs", c => {
	return c.html(`
		<html lang="en">
		  <head>
			<meta charset="utf-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1" />
			<meta name="description" content="Custom Swagger" />
			<title>Custom Swagger</title>
			<script>
			window.addEventListener("load", function forceSwagger() {
				window.ui = SwaggerUIBundle({ dom_id: '#swagger-ui',url: '/api/docs.json' })
			})
			</script>
			</head>
			${SwaggerUI({ url: '/api/doc.json' })}
		</html>
	  `)
});

const corsOptions = cors({
	credentials: true,
	// allowHeaders: [
	// 	"Content-Type",
	// 	"Cookie",
	// 	"Content-Length",
	// 	"Origin",
	// 	"x-csrf-token",
	// 	"x-auth-return-redirect",
	// ],
	// origin: (origin) => origin,
	origin: [
		"http://localhost:5173", // TODO: change to env, this is front end vite
		"http://localhost:5174", // TODO: change to env, this is front end vite
		"https://alph-pro.on.fleek.co",
		"https://alph.pro",
		"https://www.alph.pro",
		"https://breadtoken.theducklounge.com",
	],
});

// User Api
app.use("/tokens/*", corsOptions);
app.route("/tokens", tokens);

app.use("/pools/*", corsOptions);
app.route("/pools", pools);

app.use("/swaps/*", corsOptions);
app.route("/swaps", swaps);

app.use("/balances/*", corsOptions);
app.route("/balances", balances);

app.use("/v2/balances/*", corsOptions);
app.route("/v2/balances", V2Balances);

app.use("/prices/*", corsOptions);
app.route("/prices", prices);

app.use("/wallets/*", corsOptions);
app.route("/wallets", wallets);

app.use("/nfts/*", corsOptions);
app.route("/nfts", nfts);

app.use("/utils/*", corsOptions);
app.route("/utils", utils);

app.use("/auth/*", corsOptions);
app.route("/auth", auth);

app.use("/web3/*", corsOptions);
app.route("/web3", web3);

app.use("/bot/*", corsOptions);
app.route("/bot", bot);

export default app;

async function loadChildDocuments(
	baseUri: string,
	publicDocs: Record<string, string>,
) {
	const swaggerDocs = await Promise.all(
		Object.entries(publicDocs).map(([key, path]) =>
			fetch(`${baseUri}${path}/docs.json`)
				.then((a) => a.json())
				.then((docs) => ({ docs, path, key })),
		),
	);

	const mergeInput = [
		{
			oas: {
				info: { title: "Alph.Pro Indexer API", version: "v1" },
				openapi: "3.1.0",
				paths: {},
			},
		},
	] as MergeInput;

	const success = swaggerDocs.filter((a) => a.docs.openapi);
	const failure = swaggerDocs.filter((a) => !a.docs.openapi);
	for (const reason of failure) {
		logger.warn({
			msg: `[Swagger] Failed to load ${reason.key} at ${reason.path}`,
			reason,
		});
	}

	return merge(
		mergeInput.concat(
			success
				.map((a) => {
					return {
						oas: a.docs,
						description: { append: false, title: { value: a.key } },
						pathModification: { prepend: a.path },
					};
				})
				.sort((a, b) =>
					a.pathModification.prepend.localeCompare(b.pathModification.prepend),
				),
		),
	);
}
