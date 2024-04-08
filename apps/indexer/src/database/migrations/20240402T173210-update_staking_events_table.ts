import type { Kysely } from "kysely";

const tableName = "StakingEvent";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable(tableName)
    .addColumn("contractAddress", "text", (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable(tableName).dropColumn("contractAddress").execute();
}
