import { type Kysely, sql } from "kysely";

const tableName = "UserWallet";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable(tableName)
    .addColumn("isTipBot", "boolean", (col) => col.notNull().defaultTo(false))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable(tableName).ifExists().execute();
}
