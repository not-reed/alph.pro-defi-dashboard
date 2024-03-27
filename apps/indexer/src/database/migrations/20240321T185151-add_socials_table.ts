import { type Kysely, sql } from "kysely";

const tableName = "Social";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable(tableName)
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("name", "text")
    .addColumn("github", "text")
    .addColumn("website", "text")
    .addColumn("twitter", "text")
    .addColumn("telegram", "text")
    .addColumn("medium", "text")
    .addColumn("discord", "text")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable(tableName).ifExists().execute();
}
