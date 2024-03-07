import {
	FileMigrationProvider,
	Kysely,
	Migrator,
	type ColumnType,
	type Selectable,
	type Insertable,
	type Updateable,
} from "kysely";
import { BunSqliteDialect } from "kysely-bun-sqlite";
import { Database as SqliteDatabase } from "bun:sqlite";
import fs from "node:fs/promises";
import path from "node:path";

const dialect = new BunSqliteDialect({
	database: new SqliteDatabase("db.sqlite"),
});

interface CachedFileTable {
	id: ColumnType<number, number | undefined, number>;
	invalid: ColumnType<boolean, boolean | undefined, boolean | undefined>;
	path: ColumnType<string, string, string | undefined>;
	uri: ColumnType<string, string, string | undefined>;
	width: ColumnType<number, number, number | undefined>;
	height: ColumnType<number, number, number | undefined>;
	mime: ColumnType<string, string, string | undefined>;
	created_at: ColumnType<string, string, string | undefined>;
	touched_at: ColumnType<string, string, string>;
}

export type CachedFile = Selectable<CachedFileTable>;
export type CachedFileInsert = Insertable<CachedFileTable>;
export type CachedFileUpdate = Updateable<CachedFileTable>;

export interface Database {
	files: CachedFileTable;
}

export const db = new Kysely<Database>({
	dialect,
});

async function migrateToLatest() {
	const migrator = new Migrator({
		db,
		provider: new FileMigrationProvider({
			fs,
			path,
			// This needs to be an absolute path.
			migrationFolder: path.join(__dirname, "./migrations"),
		}),
	});

	const { error, results } = await migrator.migrateToLatest();

	for (const it of results ?? []) {
		if (it.status === "Success") {
			console.log(`migration "${it.migrationName}" was executed successfully`);
		} else if (it.status === "Error") {
			console.error(`failed to execute migration "${it.migrationName}"`);
		}
	}

	if (error) {
		console.error("failed to migrate");
		console.error(error);
		process.exit(1);
	}
}

await migrateToLatest();
