import { promises as fs } from "fs";
import {
	Migrator,
	FileMigrationProvider,
	type MigrationResultSet,
} from "kysely";

import path from "path";
import { db } from "./db";
import { argv } from "zx";

const migrationFolder = path.join(
	import.meta.dir,
	"../../src/database/migrations",
);

const migrator = new Migrator({
	db,
	provider: new FileMigrationProvider({
		fs,
		path,
		migrationFolder,
	}),
});

function showResults({ error, results }: MigrationResultSet) {
	if (results) {
		for (const it of results) {
			console.log(`> ${it.status}: ${it.migrationName} (${it.direction})`);
		}
		if (results.length === 0) {
			console.log("> No pending migrations to execute");
		}
	}
	if (error) {
		console.error(error);
		process.exit(1);
	}
}

const TEMPLATE = `import { Kysely, sql } from 'kysely'

const tableName = "";

export async function up(db: Kysely<unknown>): Promise<void> {
    await db.schema
        .createTable(tableName)
        .addColumn("id", "uuid", (col) =>
            col.primaryKey().defaultTo(sql\`gen_random_uuid()\`),
        )
        .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
    await db.schema.dropTable(tableName).ifExists().execute();
}
`;

if (argv._[0] === "latest") {
	const results = await migrator.migrateToLatest();
	showResults(results);
} else if (argv._[0] === "down") {
	const results = await migrator.migrateDown();
	showResults(results);
} else if (argv._[0] === "create") {
	const name = argv._[1];
	const dateStr = new Date().toISOString().replace(/[-:]/g, "").split(".")[0];
	const fileName = `${migrationFolder}/${dateStr}-${name}.ts`;
	try {
		const stat = await fs.lstat(migrationFolder);
		if (!stat.isDirectory()) {
			await fs.mkdir(migrationFolder);
		}
	} catch {
		await fs.mkdir(migrationFolder);
	}
	await fs.writeFile(fileName, TEMPLATE, "utf8");
	console.log("Created Migration:", fileName);
} else {
	console.error("Invalid command");
	process.exit(1);
}
