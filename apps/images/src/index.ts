import { mkdir } from "node:fs/promises";
import { createServer } from "./server";

await mkdir("images", { recursive: true });

const app = createServer();

export default {
	port: process.env.APP_PORT ?? 3001,
	fetch: app.fetch,
};
