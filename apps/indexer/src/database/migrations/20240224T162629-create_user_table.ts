import { Kysely, sql } from "kysely";

const tableName = "User";

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.createTable(tableName)
		.addColumn("id", "uuid", (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`),
		)
		.addColumn("name", "text")
		.addColumn("email", "text", (col) => col.unique().notNull())
		.addColumn("emailVerified", "timestamptz")
		.addColumn("image", "text")
		.execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema.dropTable(tableName).ifExists().execute();
}
