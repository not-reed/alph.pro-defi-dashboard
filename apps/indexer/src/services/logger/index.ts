import Pino from "pino";
import { config } from "../../config";

// https://github.com/pinojs/pino/blob/master/docs/api.md#options
export const logger = Pino({
	level: config.LOG_LEVEL,

	// programatic pretty print - tbd
	// transport: {
	// 	target: "pino-pretty",
	// 	options: {
	// 		colorize: true,
	// 	},
	// },
});
