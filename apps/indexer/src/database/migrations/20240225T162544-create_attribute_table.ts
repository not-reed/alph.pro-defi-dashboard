import { type Kysely, sql } from "kysely";

const tableName = "NftAttribute";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable(tableName)
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("collectionAddress", "text", (col) => col.notNull())
    .addColumn("nftId", "uuid", (col) =>
      col.references("Nft.id").onDelete("cascade").notNull()
    )
    .addColumn("key", "text", (col) => col.notNull())
    .addColumn("value", "text", (col) => col.notNull())
    .addColumn("raw", "jsonb", (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable(tableName).ifExists().execute();
}
