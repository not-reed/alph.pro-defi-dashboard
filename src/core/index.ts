import cron from "node-cron";
import { lock } from "../cache";
import nodeService from "../services/node";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

import { Plugin } from "../common/plugins/abstract";
import { db } from "../database/db";
import { logger } from "../services/logger";

const TRIBUTE_TS = 1231006505000;
const GENESIS_TS = 1636383299070;
const MAX_DURATION = 1_800_000; // 30 minutes
const OVERLAP_WINDOW = 300_000; // 5 minutes
declare global {
	// biome-ignore lint/style/noVar: <explanation>
	var interval: Timer;
}

async function getBlocks(from: number, to: number, withEvents: boolean) {
	if (to - from > MAX_DURATION) {
		throw new Error("Cannot fetch more than 30 minutes of blocks");
	}

	// const blocks = await nodeService.blockFlow.blocks(from, to);
	const blocks = await nodeService.blockFlow.blocksWithEvents(from, to);

	// TODO: sort flattened blocks by timestamp to ensure insert consistency
	return blocks.flat();
}

export async function core() {
	// clear existing jobs when `bun --hot` is being used
	for (const [, task] of cron.getTasks()) {
		task.stop();
	}
	logger.debug("Old Jobs Cleared");

	const plugins = await loadPlugins();

	const pluginNames = new Set();
	for (const plugin of plugins) {
		pluginNames.add(plugin.PLUGIN_NAME);
	}

	if (pluginNames.size !== plugins.length) {
		logger.error("Plugins cannot have duplicate names - please review");
		process.exit(1);
	}

	const pluginState = await db.selectFrom("Plugin").selectAll().execute();
	const latestMap = new Map<string, number>();
	for (const state of pluginState) {
		latestMap.set(state.name, state.timestamp.getTime());
	}

	for (const plugin of plugins) {
		logger.info(`Loaded Plugin: ${plugin.PLUGIN_NAME}`);
		// one at a time, initialize and load plugin state.
		// if brand new, initialize with TRIBUTE_TS block

		const latestTimestamp = latestMap.get(plugin.PLUGIN_NAME);
		if (!latestTimestamp) {
			logger.info(`Initializing Plugin for first run: ${plugin.PLUGIN_NAME}`);
			const blocks = await getBlocks(TRIBUTE_TS, TRIBUTE_TS + 1, true);

			const data = await plugin.process(blocks);

			await db.transaction().execute(async (trx) => {
				if (data.length) {
					await plugin.insert(trx, data);
				}
				await trx
					.insertInto("Plugin")
					.values({
						name: plugin.PLUGIN_NAME,
						timestamp: new Date(GENESIS_TS),
					})
					.onConflict((col) =>
						col.column("name").doUpdateSet({ timestamp: new Date(GENESIS_TS) }),
					)
					.execute();
				// update local cache
				latestMap.set(plugin.PLUGIN_NAME, GENESIS_TS);
			});
		}
	}

	// run every 5 seconds, can slow down to lighten computer load
	// or speed up to improve realtime processing
	// could also be modified so that cron schedule is configured per plugin
	// if there are some that should be slow, and some that should be fast
	cron.schedule("*/5 * * * * *", async () => {
		const start = Date.now();

		await plugins.map(async (plugin) => {
			try {
				await lock.using([plugin.PLUGIN_NAME], 5_000, async (signal) => {
					const latest = latestMap.get(plugin.PLUGIN_NAME);
					if (!latest) {
						throw new Error(
							`No latest timestamp found - ${plugin.PLUGIN_NAME}`,
						);
					}

					let from = latest - OVERLAP_WINDOW; // subtract 5 minutes for overlap offset
					let to = from + MAX_DURATION;
					const startFrom = from;

					logger.debug(
						`Beginning Processing '${plugin.PLUGIN_NAME}' from ${new Date(
							from,
						).toLocaleString()}`,
					);
					const now = Date.now();

					while (from < now) {
						if (Date.now() - start > 4_800) {
							// Do at most 4.5 seconds of work so that we can release the lock
							// and not tie up CPU usage so much
							logger.debug(
								`Finished Processing '${plugin.PLUGIN_NAME}' to ${new Date(
									from,
								).toLocaleString()}(${
									Math.round(((from - startFrom) / 1000 / 60 / 60) * 10) / 10
								} Hours)`,
							);
							return;
						}

						if (signal.aborted) {
							logger.warn(" Signal Aborted ");
							throw signal.error;
						}
						// TODO: use dataloader so that multiple requests in the same time frame
						// don't result in multiple requests to the node
						const blocks = await getBlocks(from, to, true);
						const flat = blocks.flat();
						const data = await plugin.process(flat);

						await db.transaction().execute(async (trx) => {
							if (data.length) {
								await plugin.insert(trx, data);
							}

							await trx
								.updateTable("Plugin")
								.set({ timestamp: new Date(to) })
								.where("name", "=", plugin.PLUGIN_NAME)
								.execute();

							// update local cache
							latestMap.set(plugin.PLUGIN_NAME, to);

							// update local state
							from = to - OVERLAP_WINDOW;
							to = from + MAX_DURATION;

							// renew lock on success
						});
					}

					logger.debug(`'${plugin.PLUGIN_NAME}' up to date`);
				});
			} catch (e) {
				logger.error({ e });
				logger.error(`Error with ${plugin.PLUGIN_NAME}`);
			}
		});
	});
}

async function loadPlugins(): Promise<Plugin<unknown>[]> {
	const files = await getFiles(join(__dirname, "../plugins"));
	if (!files?.length) {
		return [];
	}
	const plugins = await Promise.all(
		files?.map(async (file) => await import(file)),
	);

	return plugins.reduce((acc, cur) => {
		try {
			const instances: Plugin<unknown>[] = [];
			for (const key of Object.keys(cur)) {
				try {
					const tmp = new cur[key]();
					if (tmp instanceof Plugin) {
						instances.push(tmp);
					}
				} catch {}
			}
			return acc.concat(instances);
		} catch {
			return acc;
		}
	}, []);
}

async function getFiles(directoryPath: string) {
	try {
		const fileNames = await readdir(directoryPath); // returns a JS array of just short/local file-names, not paths.
		const filePaths = fileNames.map((fn) => join(directoryPath, fn));
		return filePaths;
	} catch (err) {
		console.error(err); // depending on your application, this `catch` block (as-is) may be inappropriate; consider instead, either not-catching and/or re-throwing a new Error with the previous err attached.
	}
}
