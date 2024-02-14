import { db } from "../db";
import type { NewBlock } from "../schemas/public/Block";

export async function insertMany(blocks: NewBlock[]) {
	if (!blocks.length) return [];
	return await db
		.insertInto("Block")
		.values(blocks)
		.onConflict((col) => col.doNothing())
		.execute();
}
