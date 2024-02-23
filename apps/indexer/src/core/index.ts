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
import { getLock, setLock } from "./lock";
import { startPluginTask } from "../tasks/plugins";
import { startTokensTask } from "../tasks/tokens";
import { startPricesTask } from "../tasks/prices";

function resetAllCronJobs() {
	// clear existing jobs when `bun --hot` is being used
	for (const [, task] of cron.getTasks()) {
		task.stop();
	}
	logger.debug("Old Jobs Cleared");
}

export async function core() {
	resetAllCronJobs();

	await startPluginTask();

	await startTokensTask();
	await startPricesTask();
}
