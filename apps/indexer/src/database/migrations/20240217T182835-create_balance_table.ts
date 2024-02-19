import { Kysely, sql } from "kysely";

const tableName = "Balance";

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.createTable(tableName)
		.addColumn("id", "uuid", (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`),
		)
		.addColumn("userAddress", "text", (col) => col.notNull())
		.addColumn("tokenAddress", "text", (col) => col.notNull())
		.addColumn("balance", "numeric", (col) => col.notNull())
		.execute();

	await db.schema
		.createIndex("user_token_balance_unique_index")
		.on(tableName)
		.unique()
		.columns(["userAddress", "tokenAddress"])
		.execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema.dropTable(tableName).ifExists().execute();
}
