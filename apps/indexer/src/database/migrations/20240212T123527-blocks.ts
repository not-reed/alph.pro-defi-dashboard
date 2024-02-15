import { Kysely, sql } from "kysely";

const tableName = "Block";

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.createTable(tableName)
		.addColumn("id", "uuid", (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`),
		)
		.addColumn("hash", "text", (col) => col.unique().notNull())
		.addColumn("height", "bigint", (col) => col.notNull())
		.addColumn("timestamp", "timestamptz", (col) => col.notNull())
		.addColumn("chainFrom", "int2", (col) => col.notNull())
		.addColumn("chainTo", "int2", (col) => col.notNull())
		.addColumn("transactionCount", "integer", (col) => col.notNull())
		.execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema.dropTable(tableName).ifExists().execute();
}
