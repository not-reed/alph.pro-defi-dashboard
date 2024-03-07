import { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.createTable("files")
		.addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
		.addColumn("path", "text", (col) => col.notNull())
		.addColumn("invalid", "boolean", (col) => col.notNull().defaultTo(false))
		.addColumn("uri", "text", (col) => col.notNull())
		.addColumn("width", "integer", (col) => col.notNull())
		.addColumn("height", "integer", (col) => col.notNull())
		.addColumn("mime", "text", (col) => col.notNull())
		.addColumn("created_at", "datetime", (col) => col.notNull())
		.addColumn("touched_at", "datetime", (col) => col.notNull())
		.addUniqueConstraint("uri_width_heigh", ["uri", "width", "height"])
		.execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema.dropTable("files").execute();
}
