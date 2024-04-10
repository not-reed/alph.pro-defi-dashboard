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

const BREAD_STAKING_CONTRACT = "xmqMM4kCTefEG2WDzUtczSDLYDZMnhcRjzz1Zs7zqV4K";
const BREAD_TOKEN = "2AJhBUKKaubukxfYx5S1hmmSohcBGWuDAikMhQCtsPyBm";
const ALPHBREAD_TOKEN = "28AudXLCDHEQLQaUNziXExuL5PdfwGb3utEpiGkHhT9h1";

enum BreadStakingEvent {
	Deposit = 0,
	Withdraw = 1,
	Harvest = 2,
}

export class BreadStakingPositionPlugin extends Plugin<PluginData> {
	PLUGIN_NAME = "bread-staking-position";

	startDate = new Date(1712000481889);

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
					if (![BREAD_STAKING_CONTRACT].includes(event.contractAddress)) {
						continue;
					}

					if (event.eventIndex === BreadStakingEvent.Deposit) {
						transactionDeposits.push({
							transaction: transaction.transactionHash,
							timestamp: new Date(block.timestamp),
							userAddress: event.fields[0].value as string,
							contractAddress: BREAD_STAKING_CONTRACT,
							amount: BigInt(event.fields[1].value),
							tokenAddress: ALPHBREAD_TOKEN,
							action: "deposit",
						});
					}

					if (event.eventIndex === BreadStakingEvent.Withdraw) {
						transactionWithdraws.push({
							transaction: transaction.transactionHash,
							timestamp: new Date(block.timestamp),
							userAddress: event.fields[0].value as string,
							contractAddress: BREAD_STAKING_CONTRACT,
							amount: BigInt(event.fields[1].value) * -1n,
							tokenAddress: ALPHBREAD_TOKEN,
							action: "withdraw",
						});

						for (const outputs of transaction.outputs) {
							if (outputs.tokenAddress !== BREAD_TOKEN) {
								continue;
							}
							if (outputs.userAddress !== (event.fields[0].value as string)) {
								continue;
							}

							transactionHarvests.push({
								transaction: transaction.transactionHash,
								timestamp: new Date(block.timestamp),
								userAddress: event.fields[0].value as string,
								contractAddress: BREAD_STAKING_CONTRACT,
								amount: BigInt(outputs.amount),
								tokenAddress: BREAD_TOKEN,
								action: "harvest",
							});
						}
					}

					if (event.eventIndex === BreadStakingEvent.Harvest) {
						transactionHarvests.push({
							transaction: transaction.transactionHash,
							timestamp: new Date(block.timestamp),
							userAddress: event.fields[0].value as string,
							contractAddress: BREAD_STAKING_CONTRACT,
							amount: BigInt(event.fields[1].value),
							tokenAddress: BREAD_TOKEN,
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
