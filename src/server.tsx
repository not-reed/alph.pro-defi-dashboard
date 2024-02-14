import { Hono } from "hono";
import api from "./routes/api";
import web from "./routes/web";
import { serveStatic } from "hono/bun";

import { timing as timingMiddleware } from "hono/timing";
import { requestId as requestIdMiddleware } from "./middleware/request-id";
import { prettyJSON as prettyJSONMiddleware } from "hono/pretty-json";
import { logger as loggerMiddleware } from "./middleware/logger";

export function server() {
  const app = new Hono();

  app.use("*", timingMiddleware());
  app.use("*", requestIdMiddleware());
  app.use("*", loggerMiddleware());
  app.use("*", prettyJSONMiddleware());

  app.use(
    "/static/*",
    serveStatic({
      root: "./src/public",
      rewriteRequestPath: (path) => path.replace(/^\/static/, ""),
    })
  );
  app.route("/api", api);
  app.route("*", web);

  return app;
}
