import { Hono } from "hono";

import api from "./routes/api";
import { stream, streamSSE } from "hono/streaming";
import { db } from "./database/db";

export function server() {
	const app = new Hono();

	app.route("/api", api);

	app.use("/sse/*", async (c, next) => {
		c.header("Content-Type", "text/event-stream");
		c.header("Cache-Control", "no-cache");
		c.header("Connection", "keep-alive");
		await next();
	});

	let id = 0;
	app.get("/sse", (c) => {
		// TODO: https://alpinejs.dev/magics/store
		// https://yanael.io/articles/hono-sse/
		// basic Indexer status page, start & pause buttons
		return streamSSE(c, async (stream) => {
			while (true) {
				const plugins = await db
					.selectFrom("Plugin")
					.select(["name", "timestamp"])
					.execute();

				await stream.writeSSE({
					data: JSON.stringify({ plugins }),
					event: "plugin-status",
					id: String(id++),
				});
				await stream.sleep(1000);
			}
		});
	});

	return app;
}
