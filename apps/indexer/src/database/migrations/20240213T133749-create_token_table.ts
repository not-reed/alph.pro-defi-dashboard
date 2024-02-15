import { Kysely, sql } from "kysely";

const tableName = "Token";

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.createTable(tableName)
		.addColumn("id", "uuid", (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`),
		)
		.addColumn("address", "text", (col) => col.unique().notNull())
		.addColumn("symbol", "text", (col) => col.notNull())
		.addColumn("name", "text", (col) => col.notNull())
		.addColumn("decimals", "int2", (col) => col.notNull())
		.addColumn("totalSupply", "bigint", (col) => col.notNull()) // TODO: this could change, need to track to be sure
		.execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema.dropTable(tableName).ifExists().execute();
}
