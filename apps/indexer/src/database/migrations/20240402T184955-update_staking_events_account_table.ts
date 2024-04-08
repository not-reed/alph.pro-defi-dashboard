import { type Kysely, sql } from "kysely";

const tableName = "StakingEvent";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable(tableName)
    .addColumn("accountAddress", "text", (col) => col.defaultTo(null))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable(tableName).dropColumn("accountAddress").execute();
}
