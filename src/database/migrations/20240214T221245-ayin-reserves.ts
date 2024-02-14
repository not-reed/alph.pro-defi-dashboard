import { Kysely, sql } from "kysely";

const tableName = "AyinReserve";

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.createTable(tableName)
		.addColumn("id", "uuid", (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`),
		)
		.addColumn("pairAddress", "text", (col) => col.notNull())
		.addColumn("amount0", "numeric", (col) => col.notNull())
		.addColumn("amount1", "numeric", (col) => col.notNull())
		.addColumn("totalSupply", "numeric", (col) => col.notNull())
		.execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema.dropTable(tableName).ifExists().execute();
}
