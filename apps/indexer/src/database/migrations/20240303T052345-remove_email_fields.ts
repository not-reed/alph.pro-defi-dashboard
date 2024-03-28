import { type Kysely, sql } from "kysely";

const tableName = "User";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable(tableName)
    .alterColumn("email", (col) => col.dropNotNull())
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable(tableName)
    .alterColumn("email", (col) => col.setNotNull())
    .execute();
}
