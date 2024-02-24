import { Kysely, sql } from "kysely";

const tableName = "Session";

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.createTable(tableName)
		.addColumn("id", "uuid", (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`),
		)
		.addColumn("userId", "uuid", (col) =>
			col.references("User.id").onDelete("cascade").notNull(),
		)
		.addColumn("sessionToken", "text", (col) => col.notNull().unique())
		.addColumn("expires", "timestamptz", (col) => col.notNull())
		.execute();

	await db.schema
		.createIndex("Session_userId_index")
		.on("Session")
		.column("userId")
		.execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema.dropTable(tableName).ifExists().execute();
}
