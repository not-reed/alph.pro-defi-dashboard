import type { Block } from "../services/sdk/types/block";

import type { NewBlock } from "../database/schemas/public/Block";
import { Plugin } from "../common/plugins/abstract";
import type Database from "../database/schemas/Database";
import type { Transaction } from "kysely";
import type { TransactionHash } from "../services/common/types/brands";
import type { NewPluginBlock } from "../database/schemas/public/PluginBlock";
import type { NewStakingEvent } from "../database/schemas/public/StakingEvent";

interface PluginData {
	positions: NewStakingEvent[];
	transactions: NewPluginBlock[];
}

const EMPTY: PluginData = { positions: [], transactions: [] };

const STAKING_CONTRACT = "27R7A79Ds4cEWGVaVKdFrxZBYPFM6UAKYGTaTzEjqfqQT";
const REWARD_TOKEN = "utDzMDHq8fygNzqZjCgRjhJbj1Rew14ExohxngeRKA1D";
const LP_TOKEN = "xb1NU2dPvdGUpQyTEYqXm9YSPdGKzdDSoJo78UAfxCCX";

enum BreadStakingEvent {
	Deposit = 0,
	Withdraw = 1,
	Harvest = 2,
}

export class BreadStakingPositionPlugin extends Plugin<PluginData> {
	PLUGIN_NAME = "bread-top-staking-position";

	startDate = new Date(1714080000000);

	async process(blocks: Block[]) {
		const positions: NewStakingEvent[] = [];

		for (const block of blocks) {
			for (const transaction of block.transactions) {
				const transactionHarvests: NewStakingEvent[] = [];
				const transactionDeposits: NewStakingEvent[] = [];
				const transactionWithdraws: NewStakingEvent[] = [];
				if (!transaction.events.length) {
					continue;
				}
				for (const event of transaction.events) {
					if (![STAKING_CONTRACT].includes(event.contractAddress)) {
						continue;
					}

					if (event.eventIndex === BreadStakingEvent.Deposit) {
						transactionDeposits.push({
							transaction: transaction.transactionHash,
							timestamp: new Date(block.timestamp),
							userAddress: event.fields[0].value as string,
							contractAddress: STAKING_CONTRACT,
							amount: BigInt(event.fields[1].value),
							tokenAddress: LP_TOKEN,
							action: "deposit",
						});
					}

					if (event.eventIndex === BreadStakingEvent.Withdraw) {
						transactionWithdraws.push({
							transaction: transaction.transactionHash,
							timestamp: new Date(block.timestamp),
							userAddress: event.fields[0].value as string,
							contractAddress: STAKING_CONTRACT,
							amount: BigInt(event.fields[1].value) * -1n,
							tokenAddress: LP_TOKEN,
							action: "withdraw",
						});
					}

					if (event.eventIndex === BreadStakingEvent.Harvest) {
						transactionHarvests.push({
							transaction: transaction.transactionHash,
							timestamp: new Date(block.timestamp),
							userAddress: event.fields[0].value as string,
							contractAddress: STAKING_CONTRACT,
							amount: BigInt(event.fields[1].value),
							tokenAddress: REWARD_TOKEN,
							action: "harvest",
						});
					}
				}

				positions.push(
					...transactionDeposits,
					...transactionWithdraws,
					...transactionHarvests,
				);
			}
		}

		return {
			positions,
			transactions: Array.from(
				new Set(positions.map((p) => p.transaction)),
			).map((tx) => ({
				blockHash: tx,
				pluginName: this.PLUGIN_NAME,
			})),
		};
	}

	// insert data
	async insert(trx: Transaction<Database>, data: PluginData) {
		await trx
			.insertInto("PluginBlock")
			.values(data.transactions) // throw on conflict
			.execute();

		await trx.insertInto("StakingEvent").values(data.positions).execute();
		// const { blocks } = data;
		// await trx
		//   .insertInto("Block")
		//   .values(blocks)
		//   .onConflict((col) => col.doNothing())
		//   .execute();
	}
}
