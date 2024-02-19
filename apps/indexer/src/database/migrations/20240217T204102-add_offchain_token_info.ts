import { Kysely, sql } from "kysely";

const tableName = "Token";

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.alterTable(tableName)
		.addColumn("verified", "boolean", (col) => col.defaultTo(false).notNull())
		.addColumn("description", "text")
		.addColumn("logo", "text")
		.execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.alterTable(tableName)
		.dropColumn("verified")
		.dropColumn("description")
		.dropColumn("logo")
		.execute();
}
