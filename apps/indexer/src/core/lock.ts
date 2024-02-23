import { logger } from "../services/logger";

export const locks = new Map<string, boolean>();

export function getLock(name: string) {
	return locks.get(name) ?? false;
}

export function setLock(name: string, value: boolean) {
	logger.debug(`Setting Lock for ${name} to ${value}`);
	locks.set(name, value);
}
