import { db } from "../db";

export async function findCollections(addresses: string[]) {
	if (!addresses.length) {
		return [];
	}
	return await db
		.selectFrom("NftCollection")
		.selectAll()
		.where("address", "in", addresses)
		.execute();
}
