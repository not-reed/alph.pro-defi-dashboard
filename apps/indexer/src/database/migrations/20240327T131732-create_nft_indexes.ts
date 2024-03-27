import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  // await db.schema
  //     .createTable(tableName)
  //     .addColumn("id", "uuid", (col) =>
  //         col.primaryKey().defaultTo(sql`gen_random_uuid()`),
  //     )
  //     .execute();
  // create index deadrare_listing_collection_address on "DeadRareListing" ("collectionAddress")

  await db.schema
    .createIndex("deadrare_listing_collection_address_index")
    .on("DeadRareListing")
    .column("collectionAddress")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .dropIndex("deadrare_listing_collection_address_index")
    .execute();
}
