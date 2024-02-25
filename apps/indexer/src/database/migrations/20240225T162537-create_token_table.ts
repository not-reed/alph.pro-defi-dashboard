import { Kysely, sql } from "kysely";

const tableName = "Nft";

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.createTable(tableName)
		.addColumn("id", "uuid", (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`),
		)
		.addColumn("collectionAddress", "text", (col) => col.notNull())
		.addColumn("address", "text")
		.addColumn("tokenId", "numeric")
		.addColumn("nftIndex", "numeric", (col) => col.notNull())
		.addColumn("name", "text", (col) => col.notNull())
		.addColumn("image", "text", (col) => col.notNull())
		.addColumn("description", "text", (col) => col.notNull())
		.addColumn("uri", "text", (col) => col.notNull())
		.addColumn("raw", "jsonb", (col) => col.notNull())
		.addUniqueConstraint("collection_token_unique", [
			"collectionAddress",
			"nftIndex",
		])
		.execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema.dropTable(tableName).ifExists().execute();
}
