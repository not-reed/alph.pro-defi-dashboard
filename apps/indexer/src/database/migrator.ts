import { promises as fs } from "fs";
import {
  Migrator,
  FileMigrationProvider,
  type MigrationResultSet,
} from "kysely";

import path from "path";
import { db } from "./db";
import { argv, chalk } from "zx";
import { $ } from "bun";

const migrationFolder = path.join(
  import.meta.dir,
  "../../src/database/migrations"
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
      const color =
        it.status === "Success"
          ? it.direction === "Up"
            ? chalk.green
            : chalk.blue
          : it.status === "Error"
          ? chalk.red
          : chalk.yellow;
      console.log(
        color(
          `${it.status.replace("Success", "✅")} ${it.direction.padEnd(
            8,
            " "
          )} ${it.migrationName}`
        )
      );
    }
    if (results.length === 0) {
      console.log(chalk.green("No pending migrations to execute"));
    }
  }
  if (error) {
    console.error(error);
    process.exit(1);
  }
}

const TEMPLATE = `import { type Kysely, sql } from 'kysely'

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
} else if (argv._[0] === "fresh") {
  const migrations = await migrator.getMigrations();
  for (let i = 0; i < migrations.length; i++) {
    const d = await migrator.migrateDown();
    showResults(d);
  }

  const results = await migrator.migrateToLatest();
  showResults(results);

  const t = await $`bun kanel --config=.kanelrc.cjs`.quiet();
  const [, , , ...outputs] = t.stdout.toString().split("\n");
  for (const o of outputs) {
    console.log(chalk.yellow(`${o.replace(" - ", "✅ Types   ")}`));
  }
} else {
  console.error("Invalid command");
  process.exit(1);
}

await db.destroy();
