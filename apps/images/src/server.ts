import { Hono } from "hono";
import sharp from "sharp";
import { getMimeType } from "hono/utils/mime";
import { zValidator } from "@hono/zod-validator";
import { db } from "./db";
import { z } from "zod";
import { findFile, saveFile, touchFile } from "./queries";
import { getFileMetadata, loadCachedFile, svgSharp } from "./processing";
import { cache } from "./cache";

export function createServer() {
  const app = new Hono();
  app.get(
    "/images",
    cache({
      cacheName: "images.alph.pro",
      cacheControl:
        "max-age=3600, stale-while-revalidate=86400, stale-if-error=604800", // 300 is 5 minutes
    })
  );

  app.get(
    "/images",
    zValidator(
      "query",
      z.object({
        uri: z.string(),
        width: z.coerce.number().optional().default(0),
        height: z.coerce.number().optional().default(0),
      })
    ),
    async (c, next) => {
      const { uri, width = 0, height = 0 } = c.req.valid("query");

      const cachedFile = await findFile(uri, width, height);

      if (cachedFile && !cachedFile.invalid) {
        await touchFile(cachedFile);
        return await loadCachedFile(c, cachedFile);
      }

      if (cachedFile?.invalid) {
        // unsupported filetype, just proxy
        console.warn(`Invalid cache: ${uri}`);
        return await fetch(uri);
      }

      const { filename, mime, ext } = getFileMetadata(uri);

      try {
        const raw = await fetch(uri).then((a) => a.arrayBuffer());

        const isSvg = getMimeType(uri) === "image/svg+xml";
        const instance = isSvg
          ? await svgSharp(raw, { width, height })
          : sharp(raw);
        if (width || height) {
          instance.resize({
            width: width,
            height: height,
            fit: "outside",
            withoutEnlargement: true,
          });
        }

        if (isSvg || !ext) {
          await instance.png();
        }

        const path =
          isSvg || !ext
            ? `./images/${filename}-${width}x${height}.png`
            : `./images/${filename}-${width}x${height}${ext}`;

        await instance.toFile(path);

        const file = await saveFile({
          uri,
          path,
          width,
          height,
          mime,
          created_at: new Date().toISOString(),
          touched_at: new Date().toISOString(),
        });

        if (!file) {
          throw new Error("Failed to insert file");
        }

        return await loadCachedFile(c, file);
      } catch (e) {
        await db
          .insertInto("files")
          .values({
            invalid: true,
            uri,
            path: "",
            width,
            height,
            mime,
            created_at: new Date().toISOString(),
            touched_at: new Date().toISOString(),
          })
          .onConflict((col) =>
            col.columns(["uri", "width", "height"]).doUpdateSet((eb) => ({
              invalid: eb.ref("excluded.invalid"),
              touched_at: eb.ref("excluded.touched_at"),
            }))
          )
          .execute();
        console.warn(`Errored (proxying): ${uri}`);
        return await fetch(uri);
      }
    }
  );

  return app;
}
