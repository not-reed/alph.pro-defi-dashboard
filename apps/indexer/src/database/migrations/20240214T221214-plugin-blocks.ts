import { Kysely, sql } from "kysely";

const tableName = "PluginBlock";

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.createTable(tableName)
		.addColumn("id", "uuid", (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`),
		)
		.addColumn("pluginName", "text", (col) =>
			col.references("Plugin.name").onDelete("cascade").notNull(),
		)
		.addColumn("blockHash", "text", (col) => col.notNull())
		.execute();

	await db.schema
		.createIndex("plugin_block_unique_index")
		.on(tableName)
		.unique()
		.columns(["pluginName", "blockHash"])
		.execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema.dropTable(tableName).ifExists().execute();
}
