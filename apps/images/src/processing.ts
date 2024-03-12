import { type Context } from "hono";
import sharp from "sharp";
import { getMimeType, getExtension } from "hono/utils/mime";
import { type CachedFile } from "./db";

const getContent = async (path: string) => {
  const file = Bun.file(`./${path}`);
  return (await file.exists()) ? file : null;
};

export async function loadCachedFile(
  c: Context,
  cached: Pick<CachedFile, "path" | "mime">
) {
  const content = await getContent(cached.path);
  if (!content) {
    return;
  }

  if (cached.mime) {
    c.header("Content-Type", cached.mime);
  } else {
    //. fallback, best guess, :crosses_fingers:
    c.header("Content-Type", "image/png");
  }

  return c.body(await content.arrayBuffer());
}

export function getFileMetadata(uri: string) {
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

export const svgSharp = async (
  p: ArrayBuffer,
  { width, height }: { width?: number; height?: number }
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
