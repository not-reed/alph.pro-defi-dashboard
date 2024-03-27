import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("NftCollection")
    .addColumn("listed", "boolean", (col) => col.notNull().defaultTo(true))
    .execute();

  await db.schema
    .alterTable("NftCollection")
    .addColumn("socialId", "uuid", (col) =>
      col.references("Social.id").onDelete("cascade").defaultTo(null)
    )
    .execute();

  await db.schema
    .alterTable("Token")
    .renameColumn("verified", "listed")
    .execute();

  await db.schema
    .alterTable("Token")
    .addColumn("socialId", "uuid", (col) =>
      col.references("Social.id").onDelete("cascade").defaultTo(null)
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable("Token").dropColumn("socialId").execute();

  await db.schema
    .alterTable("Token")
    .renameColumn("listed", "verified")
    .execute();

  await db.schema.alterTable("NftCollection").dropColumn("socialId").execute();

  await db.schema.alterTable("NftCollection").dropColumn("listed").execute();
}
