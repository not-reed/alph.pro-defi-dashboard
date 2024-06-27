import type { Block } from "../services/sdk/types/block";
import { Plugin } from "../common/plugins/abstract";
import type Database from "../database/schemas/Database";
import type { Transaction } from "kysely";
import type { NewPluginBlock } from "../database/schemas/public/PluginBlock";
import type { NewStakingEvent } from "../database/schemas/public/StakingEvent";
import { processStakingContractForBlocks } from "../utils/ayin-staking";

interface PluginData {
	positions: NewStakingEvent[];
	transactions: NewPluginBlock[];
}

const STAKING_CONTRACT = "2A7Nky7hk1Q9C66mN6aLLgfyXZWyZXmRfkNYuSMprmXm1";
const REWARD_TOKEN = "vT49PY8ksoUL6NcXiZ1t2wAmC7tTPRfFfER8n3UCLvXy"; // ayin
const DEPOSIT_TOKEN = "2961aauvprhETv6TXGQRc3zZY4FbLnqKon2a4wK6ABH9q"; // ayin-usdc

export class AyinAyinUsdcPositionPlugin extends Plugin<PluginData> {
	PLUGIN_NAME = "ayin-ayin-usdc-staking-position";

	startDate = new Date(1719386314484);

	async process(blocks: Block[]) {
		return await processStakingContractForBlocks(
			STAKING_CONTRACT,
			DEPOSIT_TOKEN,
			REWARD_TOKEN,
			this.PLUGIN_NAME,
			blocks,
		);
	}

	// insert data
	async insert(trx: Transaction<Database>, data: PluginData) {
		await trx
			.insertInto("PluginBlock")
			.values(data.transactions) // throw on conflict
			.execute();

		await trx.insertInto("StakingEvent").values(data.positions).execute();
	}
}
