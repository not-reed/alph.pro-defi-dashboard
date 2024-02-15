export const config = {
	// 'fatal', 'error', 'warn', 'info', 'debug', 'trace' or 'silent'
	LOG_LEVEL: process.env.LOG_LEVEL || "info",

	REDIS_PORT: Number(process.env.REDIS_PORT || 6379),

	DB_HOST: process.env.DB_HOST || "localhost",
	DB_PORT: Number(process.env.DB_PORT || 5432),
	DB_USER: process.env.DB_USER || "postgres",
	DB_NAME: process.env.DB_NAME,
	DB_PASS: process.env.DB_PASS,

	NODE_URL: process.env.NODE_URL,
	EXPLORER_URL: process.env.EXPLORER_URL,
};
