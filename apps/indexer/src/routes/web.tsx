import { type Env, Hono, type Schema } from "hono";

import { IndexerStatus } from "../pages/indexer-status";

const app = new Hono<Env, Schema, "/api">();

app.get("", (c) => {
  return c.html(<IndexerStatus />);
});

export default app;
