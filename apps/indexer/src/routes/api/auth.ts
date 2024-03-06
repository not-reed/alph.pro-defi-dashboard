import { Hono, type Env, type Schema } from "hono";

import { authHandler } from "@hono/auth-js";
const app = new Hono<Env, Schema, "/api/auth">();

app.use("*", authHandler());

export default app;
