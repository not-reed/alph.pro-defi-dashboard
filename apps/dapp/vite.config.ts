import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { sentryVitePlugin } from "@sentry/vite-plugin";

if (!process.env.VITE_API_ENDPOINT) {
	throw new Error("VITE_API_ENDPOINT is not defined");
}

// https://vitejs.dev/config/
export default defineConfig({
	build: {
		sourcemap: true, // Source map generation must be turned on
	},
	plugins: [
		vue(),
		sentryVitePlugin({
			org: process.env.SENTRY_ORG,
			project: process.env.SENTRY_PROJECT,
			authToken: process.env.SENTRY_AUTH_TOKEN,
			url: process.env.SENTRY_URL,
		}),
	],
});
