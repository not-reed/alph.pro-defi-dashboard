import { type Context, Hono } from "hono";
import sharp from "sharp";
import { getMimeType, getExtension } from "hono/utils/mime";
import { zValidator } from "@hono/zod-validator";
import { db, type CachedFile, type CachedFileInsert } from "./db";
import { z } from "zod";
import { findFile, saveFile, touchFile } from "./queries";

const getContent = async (path: string) => {
	const file = Bun.file(`./${path}`);
	return (await file.exists()) ? file : null;
};

async function loadCachedFile(
	c: Context,
	cached: Pick<CachedFile, "path" | "mime">,
) {
	const content = await getContent(cached.path);
	if (!content) {
		return;
	}

	if (cached.mime) {
		c.header("Content-Type", cached.mime);
	}

	return c.body(await content.arrayBuffer());
}

function getFileMetadata(uri: string) {
	const filename = Buffer.from(uri).toString("base64");
	const mime = getMimeType(uri) || "";
	const ext = mime ? `.${getExtension(mime)}` : "";
	if (mime !== "image/svg+xml") {
		const ext = mime ? `.${getExtension(mime)}` : "";
		return { filename, mime, ext };
	}
	// svgs get converted to pngs
	return { filename, mime: "image/png", ext: ".png" };
}

const svgSharp = async (
	p: ArrayBuffer,
	{ width, height }: { width?: number; height?: number },
) => {
	const instance = sharp(p);

	const metadata = await instance.metadata();

	const initDensity = metadata.density ?? 72;

	if (metadata.format !== "svg") {
		return instance;
	}

	let wDensity = 0;
	let hDensity = 0;
	if (width && metadata.width) {
		wDensity = (initDensity * width) / metadata.width;
	}

	if (height && metadata.height) {
		hDensity = (initDensity * height) / metadata.height;
	}

	if (!wDensity && !hDensity) {
		// both width & height are not present and/or
		// can't detect both metadata.width & metadata.height
		return instance;
	}

	return sharp(p, { density: Math.max(wDensity, hDensity) });
};

export function createServer() {
	const app = new Hono();

	app.get(
		"/images",
		zValidator(
			"query",
			z.object({
				uri: z.string(),
				width: z.coerce.number().optional().default(0),
				height: z.coerce.number().optional().default(0),
			}),
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
						})),
					)
					.execute();

				return await fetch(uri);
			}
		},
	);

	return app;
}
