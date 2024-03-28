import { type Kysely, sql } from "kysely";

const tableName = "Pool";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable(tableName)
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("factory", "text", (col) => col.notNull())
    .addColumn("pair", "text", (col) => col.unique().notNull())
    .addColumn("token0", "text", (col) => col.notNull())
    .addColumn("token1", "text", (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable(tableName).ifExists().execute();
}
