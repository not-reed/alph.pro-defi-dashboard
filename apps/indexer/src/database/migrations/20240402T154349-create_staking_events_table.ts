import { type Kysely, sql } from "kysely";

const tableName = "StakingEvent";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable(tableName)
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("transaction", "text", (col) => col.notNull())
    .addColumn("timestamp", "timestamp", (col) => col.notNull())
    .addColumn("userAddress", "text", (col) => col.notNull())
    .addColumn("amount", "numeric", (col) => col.notNull())
    .addColumn("tokenAddress", "text", (col) => col.notNull())
    .addColumn("action", "text", (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable(tableName).ifExists().execute();
}
