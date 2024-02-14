import { promises as fs } from "fs";
import { Migrator, FileMigrationProvider } from "kysely";
import { run } from "kysely-migration-cli";
import path from "path";
import { db } from "./db";

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

run(db, migrator, migrationFolder);
