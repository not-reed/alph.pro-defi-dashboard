import { type Kysely, sql } from "kysely";

const tableName = "CurrentPrice";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable(tableName)
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("address", "text", (col) => col.notNull())
    .addColumn("price", "decimal(18, 8)", (col) => col.notNull())
    .addColumn("liquidity", "numeric")
    .addColumn("source", "text", (col) => col.notNull()) // coingecko | ayin
    .addColumn("sourceKey", "text", (col) => col.notNull()) // pairAddress, coingecko id, etc
    .addColumn("timestamp", "timestamp", (col) => col.notNull())
    .execute();

  await db.schema
    .createIndex("current_price_address_source_source_key_unique_index")
    .on(tableName)
    .unique()
    .columns(["address", "source", "sourceKey"])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable(tableName).ifExists().execute();
}
