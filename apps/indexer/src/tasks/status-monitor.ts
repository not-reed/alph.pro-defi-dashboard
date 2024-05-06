import cron from "node-cron";
import { toString as parseCron } from "cronstrue";
import { EVERY_15_MINUTES } from "../core/constants";
import { db } from "../database/db";
import { config } from "../config";
import { logger } from "../services/logger";

export async function startStatusMonitorTask() {
	if (config.INDEXING_DISABLED) {
		logger.info("Indexer Status Monitor Task Disabled: Skipping");
		return;
	}

	const schedule = EVERY_15_MINUTES;

	logger.info(`Starting Indexer Status Monitor Task: ${parseCron(schedule)}`);

	// run on start and cache prices every 30 seconds
	cron.schedule(schedule, async () => {
		await checkStatus();
	});
}

const cachedPlugins = new Map<string, number>();
export async function checkStatus() {
    const plugins = await db.selectFrom("Plugin").select(["id", "timestamp"]).execute();

    for(const plugin of plugins) {
        const lastUpdated = cachedPlugins.get(plugin.id);

        if(lastUpdated && plugin.timestamp.getTime() === lastUpdated) {
            logger.error(`Plugin ${plugin.id} stuck. Last updated at ${plugin.timestamp.toLocaleString()}, now: ${new Date().toLocaleString()}`);
        }
        cachedPlugins.set(plugin.id, plugin.timestamp.getTime());
    }
	
}
