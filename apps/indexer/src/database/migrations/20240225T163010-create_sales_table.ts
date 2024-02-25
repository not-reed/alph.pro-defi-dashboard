// import { Kysely, sql } from "kysely";

// const tableName = "DeadRareSale";

// export async function up(db: Kysely<unknown>): Promise<void> {
// 	await db.schema
// 		.createTable(tableName)
// 		.addColumn("id", "uuid", (col) =>
// 			col.primaryKey().defaultTo(sql`gen_random_uuid()`),
// 		)
// 		.addColumn("collectionAddress", "text", (col) => col.notNull())
// 		.addColumn("tokenAddress", "text", (col) => col.notNull())
// 		.addColumn("from", "text", (col) => col.notNull())
// 		.addColumn("to", "text", (col) => col.notNull())
// 		.addColumn("transaction", "text", (col) => col.notNull())
// 		.addColumn("price", "numeric", (col) => col.notNull())
// 		.execute();
// }

// export async function down(db: Kysely<unknown>): Promise<void> {
// 	await db.schema.dropTable(tableName).ifExists().execute();
// }
