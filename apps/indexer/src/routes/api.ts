import { Hono, type Schema } from "hono";
import { cors } from "hono/cors";
import { type Swagger } from "atlassian-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { isErrorResult, merge } from "openapi-merge";
import { logger } from "../services/logger";
import { type AuthUser, type AuthConfig } from "@hono/auth-js";
// indexer routes
import status from "./api/status";
import sse from "./api/sse";

// user API routes
import tokens from "./api/tokens";
import pools from "./api/pools";
import balances from "./api/balances";
import prices from "./api/prices";
import auth from "./api/auth";
import nfts from "./api/nfts";
import wallets from "./api/wallets";
import web3 from "./api/web3";
import bot from "./api/bot";

const app = new Hono<
	{ Variables: { authUser: AuthUser; authConfig: AuthConfig } },
	Schema,
	"/api"
>();

app.route("/status", status);
app.route("/sse", sse);

app.get("/docs.json", async (c) => {
	const base = new URL(c.req.url).origin;

	const [balances, nfts, pools, prices, tokens] = (await Promise.all([
		// TODO: include public routes here
		fetch(`${base}/api/balances/docs.json`).then((a) => a.json()),
		fetch(`${base}/api/nfts/docs.json`).then((a) => a.json()),
		fetch(`${base}/api/pools/docs.json`).then((a) => a.json()),
		fetch(`${base}/api/prices/docs.json`).then((a) => a.json()),
		fetch(`${base}/api/tokens/docs.json`).then((a) => a.json()),
	])) as unknown as Swagger.SwaggerV3[];

	const mergeResult = merge(
		[
			{
				oas: prices,
				description: { append: true, title: { value: "Prices" } },
				pathModification: { prepend: "/api/prices" },
			},
			{
				oas: balances,
				description: { append: true, title: { value: "Balances" } },
				pathModification: { prepend: "/api/balances" },
			},
			{
				oas: nfts,
				description: { append: true, title: { value: "Nfts" } },
				pathModification: { prepend: "/api/nfts" },
			},
			{
				oas: pools,
				description: { append: true, title: { value: "Pools" } },
				pathModification: { prepend: "/api/pools" },
			},
			{
				oas: tokens,
				description: { append: true, title: { value: "Tokens" } },
				pathModification: { prepend: "/api/tokens" },
			},
		].sort((a, b) =>
			a.pathModification.prepend.localeCompare(b.pathModification.prepend),
		),
	);

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
	origin: [
		"http://localhost:5173", // TODO: change to env, this is front end vite
		"https://alph-pro.on.fleek.co/",
		"https://alph.pro",
	],
	// allowHeaders: [
	// 	"X-Custom-Header",
	// 	"Upgrade-Insecure-Requests",
	// 	// "X-Auth-Return-Redirect", // for auth-js
	// 	// "X-CSRF-Token", // for auth-js
	// 	// "Access-Control-Allow-Origin",
	// ],
	// // allowMethods: ["POST", "GET", "HEAD", "OPTIONS"],
	// exposeHeaders: [
	// 	"Content-Length",
	// 	// "X-Kuma-Revision",
	// 	// "Access-Control-Allow-Origin",
	// ],
	// maxAge: 600,
	credentials: true,
});

// User Api
app.use("/tokens/*", corsOptions);
app.route("/tokens", tokens);

app.use("/pools/*", corsOptions);
app.route("/pools", pools);

app.use("/balances/*", corsOptions);
app.route("/balances", balances);

app.use("/prices/*", corsOptions);
app.route("/prices", prices);

app.use("/wallets/*", corsOptions);
app.route("/wallets", wallets);

app.use("/nfts/*", corsOptions);
app.route("/nfts", nfts);

app.use("/auth/*", corsOptions);
app.route("/auth", auth);

app.use("/web3/*", corsOptions);
app.route("/web3", web3);

app.use("/bot/*", corsOptions);
app.route("/bot", bot);

// app.use("/api/*", verifyAuth());
// app.get("/api/protected", (c) => {
// 	const auth = c.get("authUser");
// 	return c.json(auth);
// });

export default app;
