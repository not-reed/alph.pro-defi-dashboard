import { type Env, Hono, type Schema } from "hono";
import status from "./api/status";
import sse from "./api/sse";

const app = new Hono<Env, Schema, "/api">();

app.route("/status", status);
app.route("/sse", sse);

export default app;
