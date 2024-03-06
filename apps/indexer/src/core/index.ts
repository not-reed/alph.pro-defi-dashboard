import cron from "node-cron";
import { logger } from "../services/logger";
import { startPluginTask } from "../tasks/plugins";
import { startTokensTask } from "../tasks/tokens";
import { startPricesTask } from "../tasks/prices";
import { startPoolsTask } from "../tasks/pools";

function resetAllCronJobs() {
	// clear existing jobs when `bun --hot` is being used
	for (const [, task] of cron.getTasks()) {
		task.stop();
	}
	logger.debug("Old Jobs Cleared");
}

export async function core() {
	resetAllCronJobs();

	// core indexer plugin tasks
	await startPluginTask();

	// temporary fixes until node is more reliable
	await startPoolsTask();
	await startTokensTask();
	await startPricesTask();
}
