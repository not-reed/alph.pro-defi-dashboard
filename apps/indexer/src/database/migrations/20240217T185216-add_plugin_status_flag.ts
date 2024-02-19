import { Kysely, sql } from "kysely";

const tableName = "Plugin";

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.alterTable(tableName)
		.addColumn("status", "boolean", (col) => col.defaultTo(true).notNull())
		.execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema.alterTable(tableName).dropColumn("status").execute();
}
