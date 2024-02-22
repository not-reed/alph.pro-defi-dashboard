import cron from "node-cron";
import { lock } from "../cache";

import { db } from "../database/db";
import { logger } from "../services/logger";
import { filterUnprocessedBlocks, loadPlugins } from "./utils";
import sdk from "../services/sdk";
import {
	GENESIS_TS,
	MAX_DURATION,
	OVERLAP_WINDOW,
	TRIBUTE_TS,
} from "./constants";
import { addressFromContractId } from "@alephium/web3";
import { config } from "../config";

export async function core() {
	if (config.INDEXING_DISABLED) {
		logger.warn("Indexing is disabled");
		return;
	}
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
	cron.schedule("* * * * *", async () => {
		logger.info("Running Cron");
		const start = Date.now();

		plugins.map(async (plugin) => {
			if (pluginActive.get(plugin.PLUGIN_NAME) === false) {
				// abort if manually turned off
				return;
			}
			let from = 0;
			let to = 0;
			try {
				await lock.using([plugin.PLUGIN_NAME], 30_000, async (signal) => {
					const latest = latestMap.get(plugin.PLUGIN_NAME);
					if (!latest) {
						throw new Error(
							`No latest timestamp found - ${plugin.PLUGIN_NAME}`,
						);
					}

					from = latest - OVERLAP_WINDOW; // subtract 5 minutes for overlap offset
					to = from + MAX_DURATION;
					const startFrom = from;

					logger.debug(
						`'${plugin.PLUGIN_NAME}' running from ${new Date(
							from,
						).toLocaleString()}`,
					);
					const now = Date.now();

					while (from < now) {
						if (Date.now() - start > 55_000) {
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
						const blocks = await sdk.getBlocksFromTimestamp(from, to);

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
				});
			} catch (err) {
				logger.error({
					msg: `Error with ${plugin.PLUGIN_NAME} and time range ${from}:${to}`,
					err,
				});
			}
		});
	});

	cron.schedule(
		"*/30 * * * *", // every 15 minutes
		async () => {
			const results = await fetch(
				"https://raw.githubusercontent.com/alephium/token-list/master/tokens/mainnet.json",
			).then((a) => a.json());

			if (
				!results ||
				typeof results !== "object" ||
				!("tokens" in results) ||
				!Array.isArray(results.tokens)
			) {
				logger.error("Invalid token list from github");
				return;
			}

			const tokenListIds = Array.from(
				new Set<string>(results.tokens.map((token) => token.id)),
			);
			const tokenListAddresses = tokenListIds.map(addressFromContractId);
			const tokens = await db
				.selectFrom("Token")
				.selectAll()
				.where("address", "in", tokenListAddresses)
				.execute();

			if (tokens.length !== tokenListIds.length) {
				logger.warn(
					`Github Token List Count Mismatch. Github: ${tokenListIds.length}, Local: ${tokens.length}`,
				);
			}

			for (const token of tokens) {
				const meta = results.tokens.find(
					(t) => addressFromContractId(t.id) === token.address,
				);

				if (!meta) {
					continue;
				}
				token.verified = true;
				token.description = meta.description;
				token.logo = meta.logoURI;
			}

			await db.transaction().execute(async (trx) => {
				for (const token of tokens) {
					await trx
						.updateTable("Token")
						.set(token)
						.where("id", "=", token.id)
						.execute();
				}
			});

			logger.info("Github Token List Updated");
		},
		{ runOnInit: false }, // handy flag once to initialize
	);
}
