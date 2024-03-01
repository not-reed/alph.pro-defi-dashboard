import {
	EVERY_30_SECONDS,
	FIVE_MINUTES,
	GENESIS_TS,
	MAX_DURATION,
	OVERLAP_WINDOW,
	TRIBUTE_TS,
} from "../core/constants";
import { getLock, setLock } from "../core/lock";
import { filterUnprocessedBlocks, loadPlugins } from "../core/utils";
import { db } from "../database/db";
import { logger } from "../services/logger";
import sdk from "../services/sdk";
import cron from "node-cron";

import { toString as parseCron } from "cronstrue";
import { config } from "../config";

/**
 * Loops through all plugins and runs them, processing any and all blocks until up to date
 */
export async function startPluginTask() {
	if (config.INDEXING_DISABLED) {
		logger.info("Plugin Task Disabled: Skipping");
		return;
	}
	const schedule = EVERY_30_SECONDS;

	logger.info(`Starting Plugin Task: ${parseCron(schedule)}`);

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
	const pluginActive = new Map(
		pluginState.map((state) => [state.name, state.status]),
	);
	const latestMap = new Map<string, number>();
	for (const state of pluginState) {
		latestMap.set(state.name, state.timestamp.getTime());
	}

	for (const plugin of plugins) {
		logger.info(
			`Loaded Plugin: ${plugin.PLUGIN_NAME} (active: ${
				pluginActive.get(plugin.PLUGIN_NAME) ?? true
			})`,
		);
		// one at a time, initialize and load plugin state.
		// if brand new, initialize with TRIBUTE_TS block

		// if no timestamp, will assume its absent from the database entirely
		// note: may not be true if you are messing around manually in the db
		const latestTimestamp = latestMap.get(plugin.PLUGIN_NAME);
		if (!latestTimestamp) {
			logger.info(`Initializing Plugin for first run: ${plugin.PLUGIN_NAME}`);
			const blocks = await sdk.getBlocksFromTimestamp(TRIBUTE_TS);

			const blocksToProcess = await filterUnprocessedBlocks(
				plugin.PLUGIN_NAME,
				blocks,
			);
			if (!blocksToProcess.length) {
				continue;
			}

			const data = await plugin.process(blocksToProcess);

			await db.transaction().execute(async (trx) => {
				// insert first as it doesn't yet exist
				await trx
					.insertInto("Plugin")
					.values({
						name: plugin.PLUGIN_NAME,
						timestamp: new Date(GENESIS_TS),
					})
					.execute();
				await plugin.insert(trx, data);
				// update local cache
				pluginActive.set(plugin.PLUGIN_NAME, true);
				latestMap.set(plugin.PLUGIN_NAME, GENESIS_TS);
			});
		}
	}

	// run every 5 seconds, can slow down to lighten computer load
	// or speed up to improve realtime processing
	// could also be modified so that cron schedule is configured per plugin
	// if there are some that should be slow, and some that should be fast
	cron.schedule(schedule, async () => {
		logger.debug("Running Cron");

		plugins.map(async (plugin): Promise<void> => {
			if (pluginActive.get(plugin.PLUGIN_NAME) === false) {
				// abort if manually turned off
				return;
			}
			let lastFrom = 0;
			let lastTo = 0;
			if (getLock(plugin.PLUGIN_NAME)) {
				return;
			}

			try {
				setLock(plugin.PLUGIN_NAME, true);

				logger.info(`Got Lock for ${plugin.PLUGIN_NAME}`);
				const latest = latestMap.get(plugin.PLUGIN_NAME);
				if (!latest) {
					throw new Error(`No latest timestamp found - ${plugin.PLUGIN_NAME}`);
				}
				lastFrom = latest - OVERLAP_WINDOW; // only for logging
				let from = latest - OVERLAP_WINDOW; // subtract 5 minutes for overlap offset
				lastTo = from + MAX_DURATION; // only for logging
				let to = from + MAX_DURATION;

				logger.debug(
					`'${plugin.PLUGIN_NAME}' running from ${new Date(
						from,
					).toLocaleString()}`,
				);
				const now = Date.now() - FIVE_MINUTES; // five minute delay to allow explorer to keep up

				while (from < now) {
					logger.info(
						`${plugin.PLUGIN_NAME} - Fetching Blocks from ${from} to ${to}`,
					);
					const blocks = await sdk.getBlocksFromTimestamp(from, to);
					logger.info(
						`${plugin.PLUGIN_NAME} - Fetched Blocks from ${from} to ${to} (COMPLETE - ${blocks.length} Blocks)`,
					);

					if (!blocks.length) {
						logger.warn(
							`No blocks found for '${plugin.PLUGIN_NAME}' time span, Skipping => ${from}:${to}`,
						);

						await db.transaction().execute(async (trx) => {
							// only update if above continues successfully, otherwise will retry

							const lastTo = new Date(Math.min(to, now));

							await trx
								.updateTable("Plugin")
								.set({ timestamp: lastTo })
								.where("name", "=", plugin.PLUGIN_NAME)
								.execute();

							latestMap.set(plugin.PLUGIN_NAME, lastTo.getTime());

							// use actual 'to' value, not lastTo
							// since actual 'to' will be far enough in the future
							// that if no work needs to be done, we will just abort
							from = to - OVERLAP_WINDOW;
							to = from + MAX_DURATION;
						});
						continue;
					}

					const blocksToProcess = await filterUnprocessedBlocks(
						plugin.PLUGIN_NAME,
						blocks,
					);

					if (!blocksToProcess.length) {
						logger.warn(
							`No processable blocks found for '${plugin.PLUGIN_NAME}' time span, Skipping => ${from}:${to}`,
						);

						await db.transaction().execute(async (trx) => {
							// only update if above continues successfully, otherwise will retry

							const lastTo = new Date(Math.min(to, now));

							await trx
								.updateTable("Plugin")
								.set({ timestamp: lastTo })
								.where("name", "=", plugin.PLUGIN_NAME)
								.execute();

							latestMap.set(plugin.PLUGIN_NAME, lastTo.getTime());

							// use actual 'to' value, not lastTo
							// since actual 'to' will be far enough in the future
							// that if no work needs to be done, we will just abort
							from = to - OVERLAP_WINDOW;
							to = from + MAX_DURATION;
						});
						continue;
					}

					const data = await plugin.process(blocksToProcess);

					await db.transaction().execute(async (trx) => {
						await plugin.insert(trx, data);

						// only update if above continues successfully, otherwise will retry

						const lastTo = new Date(Math.min(to, now));

						await trx
							.updateTable("Plugin")
							.set({ timestamp: lastTo })
							.where("name", "=", plugin.PLUGIN_NAME)
							.execute();

						latestMap.set(plugin.PLUGIN_NAME, lastTo.getTime());

						// use actual 'to' value, not lastTo
						// since actual 'to' will be far enough in the future
						// that if no work needs to be done, we will just abort
						from = to - OVERLAP_WINDOW;
						to = from + MAX_DURATION;
					});
				}
				logger.debug(`'${plugin.PLUGIN_NAME}' up to date`);
			} catch (err) {
				if (lastFrom || lastTo) {
					logger.error({
						msg: `Error with in time range  ${plugin.PLUGIN_NAME}:${lastFrom}:${lastTo}`,
						err,
					});
				} else {
					logger.error({ err });
				}
			} finally {
				setLock(plugin.PLUGIN_NAME, false);
			}
		});
	});
}
