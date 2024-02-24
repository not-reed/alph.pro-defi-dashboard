import { Kysely, sql } from "kysely";

const tableName = "UserWallet";

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.createTable(tableName)
		.addColumn("id", "uuid", (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`),
		)
		.addColumn("userId", "uuid", (col) =>
			col.references("User.id").onDelete("cascade").notNull(),
		)
		.addColumn("address", "text", (col) => col.notNull())
		.addColumn("verified", "boolean", (col) => col.notNull().defaultTo(false))
		.execute();

	await db.schema
		.createIndex("user_wallet_unique_index")
		.on(tableName)
		.unique()
		.columns(["userId", "address"])
		.execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema.dropTable(tableName).ifExists().execute();
}
