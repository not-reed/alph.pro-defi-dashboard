import { Kysely, sql } from "kysely";

const tableName = "CurrentPrice";

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.deleteFrom(tableName).execute();
	await db.schema.alterTable(tableName).dropColumn("price").execute();

	await db.schema.alterTable(tableName).addColumn("price", "numeric").execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.deleteFrom(tableName).execute();
	await db.schema.alterTable(tableName).dropColumn("price").execute();
	await db.schema.alterTable(tableName).addColumn("price", "numeric").execute();
}
