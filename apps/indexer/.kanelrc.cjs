const { makeKyselyHook } = require("kanel-kysely");

/** @type {import('kanel').Config} */
module.exports = {
  connection: {
    host: process.env.DB_HOST,
    password: process.env.DB_PASS,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  },

  preDeleteOutputFolder: true,
  outputPath: "./src/database/schemas",

  preRenderHooks: [makeKyselyHook()],

  customTypeMap: {
    "pg_catalog.int8": {
      name: "bigint",
    },
    "pg_catalog.numeric": {
      name: "bigint",
    },
    "pg_catalog.decimal(18, 8)": {
      name: "number",
    },
  },
};
