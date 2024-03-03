import type { AuthConfig } from "@hono/auth-js";
import type { Context } from "hono";
import { type DiscordProfile } from "@auth/core/providers/discord";
import { type OAuthUserConfig, type OAuthConfig } from "@auth/core/providers";
import { config } from "./config";
import { db } from "./database/db";
import { KyselyAdapter } from "./kysely-adapter";

function Discord<P extends DiscordProfile>(
	options: OAuthUserConfig<P>,
): OAuthConfig<P> {
	return {
		id: "discord",
		name: "Discord",
		type: "oauth",
		authorization: "https://discord.com/api/oauth2/authorize?scope=identify",
		token: "https://discord.com/api/oauth2/token",
		userinfo: "https://discord.com/api/users/@me",
		profile(profile) {
			if (profile.avatar === null) {
				const defaultAvatarNumber =
					profile.discriminator === "0"
						? Number(BigInt(profile.id) >> BigInt(22)) % 6
						: parseInt(profile.discriminator) % 5;
				profile.image_url = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`;
			} else {
				const format = profile.avatar.startsWith("a_") ? "gif" : "png";
				profile.image_url = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`;
			}
			return {
				id: profile.id,
				name: profile.global_name ?? profile.username,
				email: profile.email,
				image: profile.image_url,
			};
		},
		style: { logo: "/discord.svg", bg: "#5865F2", text: "#fff" },
		options,
	};
}

export function getAuthConfig(c: Context): AuthConfig {
	return {
		debug: false,

		// skipCSRFCheck: skipCSRFCheck,
		secret: config.AUTH_SECRET,
		redirectProxyUrl: config.AUTH_REDIRECT_URL,
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
