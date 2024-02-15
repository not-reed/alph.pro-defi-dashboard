// create your own bun:sqlite driver?
// https://supabase.com/docs/guides/functions/kysely-postgres

import { Pool, types } from "pg";
import { Kysely, PostgresDialect } from "kysely";

import { config } from "../config.ts";
import type Database from "./schemas/Database.ts";
import { logger } from "../services/logger/index.ts";

// int8
types.setTypeParser(types.builtins.INT8, (val) => BigInt(val));

// normally numeric can contain decimals, but we are
// using it for bigint which contains none.
// this is for i.e. pool reserves
types.setTypeParser(types.builtins.NUMERIC, (val) => BigInt(val));

// types.setTypeParser(1700)

const dialect = new PostgresDialect({
	pool: new Pool({
		database: config.DB_NAME,
		host: config.DB_HOST,
		user: config.DB_USER,
		password: config.DB_PASS,
		port: config.DB_PORT,
		max: 10,
	}),
});

// Database interface is passed to Kysely's constructor, and from now on, Kysely
// knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how
// to communicate with your database.
const db = new Kysely<Database>({
	dialect,
});

logger.info("Database connected");
export { db };
