import type { AuthConfig } from "@hono/auth-js";
import type { Context } from "hono";
import Discord from "@auth/core/providers/discord";
import { config } from "./config";
import { db } from "./database/db";
import { KyselyAdapter } from "./kysely-adapter";
import { skipCSRFCheck } from "@auth/core";

export function getAuthConfig(c: Context): AuthConfig {
	return {
		debug: true,
		// skipCSRFCheck: skipCSRFCheck,
		secret: config.AUTH_SECRET,
		adapter: KyselyAdapter(db),
		providers: [
			Discord({
				clientId: config.DISCORD_CLIENT_ID,
				clientSecret: config.DISCORD_CLIENT_SECRET,
			}),
		],
		pages: {
			// signIn: "/signin",
		},
		callbacks: {
			async redirect({ url, baseUrl }) {
				// Allows relative callback URLs
				return "/success";
			},
		},
	};
}
