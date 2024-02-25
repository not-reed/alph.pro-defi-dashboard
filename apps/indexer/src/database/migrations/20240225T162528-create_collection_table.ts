import { Kysely, sql } from "kysely";

const tableName = "NftCollection";

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.createTable(tableName)
		.addColumn("id", "uuid", (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`),
		)
		.addColumn("address", "text", (col) => col.notNull())
		.addColumn("uri", "text", (col) => col.notNull())
		.addColumn("image", "text", (col) => col.notNull())
		.addColumn("name", "text", (col) => col.notNull())
		.addColumn("description", "text", (col) => col.notNull())
		.addColumn("raw", "jsonb", (col) => col.notNull())
		.addUniqueConstraint("address_unique", ["address"])
		.execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema.dropTable(tableName).ifExists().execute();
}
