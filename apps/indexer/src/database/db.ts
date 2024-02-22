import { Pool, types } from "pg";
import { Kysely, PostgresDialect } from "kysely";

import { config } from "../config.ts";
import type Database from "./schemas/Database.ts";
import { logger } from "../services/logger/index.ts";

// typescript/postgres bigint support
types.setTypeParser(types.builtins.INT8, (val) => BigInt(val));
types.setTypeParser(types.builtins.NUMERIC, (val) => BigInt(val));

const connection = {
	database: config.DB_NAME,
	host: config.DB_HOST,
	user: config.DB_USER,
	password: config.DB_PASS,
	port: config.DB_PORT,
	max: 10,
};

const dialect = new PostgresDialect({
	pool: new Pool(connection),
});

const db = new Kysely<Database>({ dialect });

await db
	.selectFrom("Plugin")
	.selectAll()
	.executeTakeFirst()
	.then((result) => {
		logger.info("Database connected");
	})
	.catch((err) => {
		logger.error("Database connection failed", err);
	});

export { db };
