import { type Env, Hono, type Schema } from "hono";

import { IndexerStatus } from "../pages/indexer-status";
import { Success } from "../pages/success";

const app = new Hono<Env, Schema, "/api">();

app.get("", (c) => {
  return c.html(<IndexerStatus />);
});

app.get("/wc", (c) => {
  const { uri } = c.req.query();
  return c.redirect(`alephium://wc=${uri}`);
});

app.get("/success", (c) => {
  return c.html(<Success />);
});

export default app;
