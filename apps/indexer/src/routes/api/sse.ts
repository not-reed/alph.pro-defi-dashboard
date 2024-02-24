import { type Env, Hono, type Schema } from "hono";
import { streamSSE } from "hono/streaming";
import { db } from "../../database/db";
import { logger } from "../../services/logger";

const app = new Hono<Env, Schema, "/api/status">();

app.use("/*", async (c, next) => {
	c.header("Content-Type", "text/event-stream");
	c.header("Cache-Control", "no-cache");
	c.header("Connection", "keep-alive");
	await next();
});

let id = 0;
app.get("/plugins", (c) => {
	// basic Indexer status page, start & pause buttons
	return streamSSE(c, async (stream) => {
		while (true) {
			if (c.req.raw.signal.aborted) {
				break;
			}

			logger.info("[SSE] Fetching plugin status");

			const plugins = await db
				.selectFrom("Plugin")
				.select(["name", "timestamp"])
				.execute();

			logger.info("[SSE] Plugin status fetched. Writing status to stream");

			await stream.writeSSE({
				data: JSON.stringify({ plugins }),
				event: "plugin-status",
				id: String(id++),
			});

			logger.info("[SSE] Plugin status written to stream. Sleeping");

			await stream.sleep(1000);
		}
	});
});

export default app;
