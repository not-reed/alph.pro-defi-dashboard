export const config = {
	// 'fatal', 'error', 'warn', 'info', 'debug', 'trace' or 'silent'
	LOG_LEVEL: process.env.LOG_LEVEL || "info",

	// disable indexing, and only serve API
	INDEXING_DISABLED: process.env.INDEXING_DISABLED === "true",

	REDIS_PORT: Number(process.env.REDIS_PORT || 6379),

	DB_HOST: process.env.DB_HOST || "localhost",
	DB_PORT: Number(process.env.DB_PORT || 5432),
	DB_USER: process.env.DB_USER || "postgres",
	DB_NAME: process.env.DB_NAME,
	DB_PASS: process.env.DB_PASS,

	NODE_URL: process.env.NODE_URL,
	NODE_BASIC_AUTH: process.env.NODE_BASIC_AUTH,
	NODE_API_KEY: process.env.NODE_API_KEY,
	EXPLORER_URL: process.env.EXPLORER_URL,
	EXPLORER_BASIC_AUTH: process.env.EXPLORER_BASIC_AUTH,
};
