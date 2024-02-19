import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

if (!process.env.VITE_API_ENDPOINT) {
	throw new Error("VITE_API_ENDPOINT is not defined");
}

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [vue()],
});
