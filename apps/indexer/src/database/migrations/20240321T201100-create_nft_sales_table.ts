import { type Kysely, sql } from "kysely";

const tableName = "DeadRareListing";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable(tableName)
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("price", "numeric", (col) => col.notNull())
    .addColumn("listingId", "numeric", (col) => col.notNull().unique())
    .addColumn("collectionAddress", "text", (col) => col.notNull())
    .addColumn("tokenAddress", "text", (col) => col.notNull())
    .addColumn("seller", "text", (col) => col.notNull())
    .addColumn("buyer", "text", (col) => col.defaultTo(null))
    .addColumn("listingAddress", "text", (col) => col.notNull())
    .addColumn("listedAt", "timestamptz", (col) => col.notNull())
    .addColumn("listedTransaction", "text", (col) => col.notNull())
    .addColumn("soldAt", "timestamptz", (col) => col.defaultTo(null))
    .addColumn("soldTransaction", "text", (col) => col.defaultTo(null))
    .addColumn("unlistedAt", "timestamptz", (col) => col.defaultTo(null))
    .addColumn("unlistedTransaction", "text", (col) => col.defaultTo(null))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable(tableName).ifExists().execute();
}
