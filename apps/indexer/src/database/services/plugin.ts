import type { Transaction } from "kysely";
import type PublicSchema from "../schemas/public/PublicSchema";
import { db } from "../db";

export async function findPlugins() {
	return await db.selectFrom("Plugin").selectAll().execute();
}

export async function insertPluginTimestamp(
	pluginName: string,
	timestamp: Date,
	trx: Transaction<PublicSchema>,
) {
	return await trx
		.insertInto("Plugin")
		.values({ name: pluginName, timestamp })
		.execute();
}

export async function updatePluginTimestamp(
	pluginName: string,
	timestamp: Date,
	trx: Transaction<PublicSchema>,
) {
	return await trx
		.updateTable("Plugin")
		.set({ timestamp })
		.where("name", "=", pluginName)
		.execute();
}
