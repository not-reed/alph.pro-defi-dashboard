import { createMiddleware } from "hono/factory";

export const HEADER_REQUEST_ID = "X-Request-ID";

function createRequestId() {
	return `0x${Math.floor(Math.random() * 0xffffffff)
		.toString(16)
		.padStart(8, "0")}`;
}
export const requestId = () => {
	return createMiddleware(async (c, next) => {
		const id = createRequestId();
		// set header for front end logs
		c.header(HEADER_REQUEST_ID, id);

		// set to context for server logging, etc
		c.set(HEADER_REQUEST_ID, id);

		await next();
	});
};
