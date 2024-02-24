import { Kysely, sql } from "kysely";

const tableName = "Account";

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.createTable(tableName)
		.addColumn("id", "uuid", (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`),
		)
		.addColumn("userId", "uuid", (col) =>
			col.references("User.id").onDelete("cascade").notNull(),
		)
		.addColumn("type", "text", (col) => col.notNull())
		.addColumn("provider", "text", (col) => col.notNull())
		.addColumn("providerAccountId", "text", (col) => col.notNull())
		.addColumn("refresh_token", "text")
		.addColumn("access_token", "text")
		.addColumn("expires_at", "bigint")
		.addColumn("token_type", "text")
		.addColumn("scope", "text")
		.addColumn("id_token", "text")
		.addColumn("session_state", "text")
		.execute();

	await db.schema
		.createIndex("Account_userId_index")
		.on("Account")
		.column("userId")
		.execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema.dropTable(tableName).ifExists().execute();
}
