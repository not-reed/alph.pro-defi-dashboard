import chalk from "chalk";
import { createMiddleware } from "hono/factory";
import { type Logger, pino } from "pino";
import { HEADER_REQUEST_ID } from "./request-id";

// https://github.com/honojs/hono/blob/main/src/utils/url.ts
const getPath = (request: Request): string => {
	// Optimized: RegExp is faster than indexOf() + slice()
	const match = request.url.match(/^https?:\/\/[^/]+(\/[^?]*)/);
	return match ? match[1] : "";
};

// https://github.com/honojs/hono/blob/main/src/middleware/logger/index.ts
enum LogPrefix {
	Outgoing = "-->",
	Incoming = "<--",
	Error = "xxx",
}

const humanize = (times: string[]) => {
	const [delimiter, separator] = [",", "."];

	const orderTimes = times.map((v) =>
		v.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, `$1${delimiter}`),
	);

	return orderTimes.join(separator);
};

const time = (start: number) => {
	const delta = Date.now() - start;
	return humanize([
		delta < 1000 ? `${delta}ms` : `${Math.round(delta / 1000)}s`,
	]);
};

const colorStatus = (status: number) => {
	const out: { [key: string]: string } = {
		7: chalk.magenta(status),
		5: chalk.red(status),
		4: chalk.yellow(status),
		3: chalk.cyan(status),
		2: chalk.green(status),
		1: chalk.green(status),
		0: chalk.yellow(status),
	};

	const calculateStatus = (status / 100) | 0;

	return out[calculateStatus];
};

function log(
	logger: Logger,
	requestId: string,
	prefix: string,
	method: string,
	path: string,
	status = 0,
	elapsed?: string,
) {
	const incoming = prefix === LogPrefix.Incoming;
	const direction = incoming ? "IN" : "OUT";
	const msg =
		prefix === LogPrefix.Incoming
			? chalk.dim(`${prefix} ${method} ${path}`)
			: `${prefix} ${method} ${path} ${colorStatus(status)} ${elapsed}`;

	if (!status || status < 400) {
		logger.info({
			msg,
			status: incoming ? undefined : status,
			method,
			requestId,
			direction,
			elapsed,
		});
	} else {
		logger.warn({ msg, direction, status, method, requestId, elapsed });
	}
}

export const logger = (logger = pino()) => {
	const child = logger.child({ module: "http request" });
	return createMiddleware(async (c, next) => {
		const { method } = c.req;
		const path = getPath(c.req.raw);

		const requestId = c.get(HEADER_REQUEST_ID);

		log(child, requestId, LogPrefix.Incoming, method, path);

		const start = Date.now();

		await next();

		log(
			child,
			requestId,
			LogPrefix.Outgoing,
			method,
			path,
			c.res.status,
			time(start),
		);
	});
};
