import { Kysely, sql } from "kysely";

const tableName = "AyinLiquidityEvent";

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.createTable(tableName)
		.addColumn("id", "uuid", (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`),
		)
		.addColumn("userAddress", "text", (col) => col.notNull())
		.addColumn("pairAddress", "text", (col) => col.notNull())
		.addColumn("amount0", "numeric", (col) => col.notNull())
		.addColumn("amount1", "numeric", (col) => col.notNull())
		.addColumn("liquidity", "numeric", (col) => col.notNull())
		.addColumn("action", "text", (col) => col.notNull()) // Mint/Burn
		.addColumn("timestamp", "timestamptz", (col) => col.notNull())
		.addColumn("transactionHash", "text", (col) => col.notNull())
		.execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema.dropTable(tableName).ifExists().execute();
}
