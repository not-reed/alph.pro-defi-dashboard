export const config = {
	REDIS_PORT: Number(process.env.REDIS_PORT),

	DB_HOST: process.env.DB_HOST,
	DB_PORT: Number(process.env.DB_PORT),
	DB_NAME: process.env.DB_NAME,
	DB_USER: process.env.DB_USER,
	DB_PASS: process.env.DB_PASS,

	NODE_URL: process.env.NODE_URL,
	EXPLORER_URL: process.env.EXPLORER_URL,
};
