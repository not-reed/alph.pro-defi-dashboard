import { Auth } from "@auth/core";
import type { AuthConfig, AuthEnv } from "@hono/auth-js";
import { Hono, type Env } from "hono";
import { env } from "hono/adapter";
import { HTTPException } from "hono/http-exception";
import type { BlankSchema, MiddlewareHandler } from "hono/types";

const app = new Hono<Env, BlankSchema, "/api/auth">();

// hono/auth-js looses body in request
function setEnvDefaults(env: AuthEnv, config: AuthConfig) {
	config.secret ??= env.AUTH_SECRET;
	config.basePath ??= "/api/auth";
	config.trustHost = true;
	config.redirectProxyUrl ??= env.AUTH_REDIRECT_PROXY_URL;
	config.providers = config.providers.map((p) => {
		const finalProvider = typeof p === "function" ? p({}) : p;
		if (finalProvider.type === "oauth" || finalProvider.type === "oidc") {
			const ID = finalProvider.id.toUpperCase();
			finalProvider.clientId ??= env[`AUTH_${ID}_ID`];
			finalProvider.clientSecret ??= env[`AUTH_${ID}_SECRET`];
			if (finalProvider.type === "oidc") {
				finalProvider.issuer ??= env[`AUTH_${ID}_ISSUER`];
			}
		}
		return finalProvider;
	});
}

function reqWithEnvUrl(req: Request, authUrl?: string): Request {
	if (authUrl) {
		const reqUrlObj = new URL(req.url);
		const authUrlObj = new URL(authUrl);
		const props = [
			"hostname",
			"protocol",
			"port",
			"password",
			"username",
		] as const;
		for (const prop of props) {
			reqUrlObj[prop] = authUrlObj[prop];
		}
		// TODO: hono/auth-js looses body here, and won't login
		return new Request(reqUrlObj.href, {
			method: req.method,
			body: req.body,
			headers: req.headers,
			credentials: req.credentials,
		});
	}
	return req;
}
function authHandler(): MiddlewareHandler {
	return async (c) => {
		const config = c.get("authConfig");

		setEnvDefaults(env(c), config);

		if (!config.secret) {
			throw new HTTPException(500, { message: "Missing AUTH_SECRET" });
		}
		console.log("beep boop");
		const res = await Auth(reqWithEnvUrl(c.req.raw, env(c).AUTH_URL), config);
		return new Response(res.body, res);
	};
}

app.use("*", authHandler());

export default app;
