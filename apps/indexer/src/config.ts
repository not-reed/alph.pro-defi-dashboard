export const config = {
	// 'fatal', 'error', 'warn', 'info', 'debug', 'trace' or 'silent'
	LOG_LEVEL: process.env.LOG_LEVEL || "info",

	// disable indexing, and only serve API
	INDEXING_DISABLED: process.env.INDEXING_DISABLED === "true",

	// Redis
	REDIS_PORT: Number(process.env.REDIS_PORT || 6379),
	REDIS_HOST: process.env.REDIS_HOST || "127.0.0.1",

	// Postgres
	DB_HOST: process.env.DB_HOST || "localhost",
	DB_PORT: Number(process.env.DB_PORT || 5432),
	DB_USER: process.env.DB_USER || "postgres",
	DB_NAME: process.env.DB_NAME,
	DB_PASS: process.env.DB_PASS,

	// Alephium Connections
	NODE_URL: process.env.NODE_URL as string,
	NODE_BASIC_AUTH: process.env.NODE_BASIC_AUTH,
	NODE_API_KEY: process.env.NODE_API_KEY,
	EXPLORER_URL: process.env.EXPLORER_URL as string,
	EXPLORER_BASIC_AUTH: process.env.EXPLORER_BASIC_AUTH,

	// AuthJS
	AUTH_SECRET: process.env.AUTH_SECRET as string,
	AUTH_URL: process.env.AUTH_URL,
	AUTH_REDIRECT_URL: process.env.AUTH_REDIRECT_URL as string,

	// Discord
	DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
	DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,

	// BOT
	BOT_AUTH_TOKEN: process.env.BOT_AUTH_TOKEN as string,
};
