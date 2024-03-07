import { db, type CachedFile, type CachedFileInsert } from "./db";

export async function touchFile(cachedFile: CachedFile) {
	return await db
		.updateTable("files")
		.set("touched_at", new Date().toISOString())
		.where("id", "=", cachedFile.id)
		.execute();
}

export async function findFile(uri: string, width: number, height: number) {
	return await db
		.selectFrom("files")
		.selectAll()
		.where("uri", "=", uri)
		.where("width", "=", width)
		.where("height", "=", height)
		.executeTakeFirst();
}

export async function saveFile(file: CachedFileInsert) {
	return await db
		.insertInto("files")
		.values(file)
		.returningAll()
		.executeTakeFirst();
}
