// NGU: '21nj6sBTtQfTwCErYAHF3CNBaDRAc1E1Q3aUCcbsuG8mu
// http://10.11.12.13:9090/contracts/21nj6sBTtQfTwCErYAHF3CNBaDRAc1E1Q3aUCcbsuG8mu/parent
// http://10.11.12.13:9090/contract-events/contract-address/21nj6sBTtQfTwCErYAHF3CNBaDRAc1E1Q3aUCcbsuG8mu?page=1&limit=100
// Ayin Factory: 'vyrkJHG49TXss6pGAz2dVxq5o7mBXNNXAV18nAeqVT1R'
// http://10.11.12.13:9090/contracts/vyrkJHG49TXss6pGAz2dVxq5o7mBXNNXAV18nAeqVT1R/sub-contracts?page=1&limit=100
// http://10.11.12.13:9090/contract-events/contract-address/vyrkJHG49TXss6pGAz2dVxq5o7mBXNNXAV18nAeqVT1R?page=1&limit=100

import type { Block } from "../services/common/types/blocks";

import { Plugin } from "../common/plugins/abstract";
import type Database from "../database/schemas/Database";
import type { Transaction } from "kysely";
import type { NewPool } from "../database/schemas/public/Pool";
import { addressFromContractId } from "@alephium/web3";
import { db } from "../database/db";
import type { NewPluginLog } from "../database/schemas/public/PluginLog";

import type { NewAyinSwap } from "../database/schemas/public/AyinSwap";
import type { ContractAddress } from "../services/common/types/brands";
import type { NewAyinLiquidityEvent } from "../database/schemas/public/AyinLiquidityEvent";

const AYIN_FACTORY = "vyrkJHG49TXss6pGAz2dVxq5o7mBXNNXAV18nAeqVT1R";

interface PluginData {
	liquidity: NewAyinLiquidityEvent[];
	// swap: NewAyinSwap[]; // TODO:
	// reserves: NewAyinReserve[]; // TODO:
	blocks: NewPluginLog[];
}
export class AyinPoolsPlugin extends Plugin<PluginData> {
	PLUGIN_NAME = "ayin-liquidity";

	async process(blocks: Block[]) {
		const contractEvents = new Set(
			blocks.flatMap((block) =>
				block.transactions.flatMap((transaction) =>
					transaction.events.flatMap((event) => event.contractAddress),
				),
			),
		);
		if (!contractEvents.size) {
			return { liquidity: [], blocks: [] };
		}

		const pools = await db
			.selectFrom("Pool")
			.selectAll()
			.where("pair", "in", Array.from(contractEvents))
			.execute();

		const reserves = await db
			.selectFrom("AyinReserve")
			.selectAll()
			.where("pairAddress", "in", Array.from(contractEvents))
			.execute();

		const poolMap = new Map(pools.map((pool) => [pool.pair, pool]));
		const reserveMap = new Map(
			reserves.map((reserve) => [reserve.pairAddress, reserve]),
		);

		const processedBlocks = new Set<NewPluginLog>();
		const newLiquidity = new Set<NewAyinLiquidityEvent>();
		const newSwap = new Set<NewAyinSwap>();

		for (const block of blocks) {
			for (const transaction of block.transactions) {
				for (const event of transaction.events) {
					if (event.fields.length === 4 && [0, 1].includes(event.eventIndex)) {
						// best guess, some false positives, but alternatively
						// we run the risk of missing some interactions
						const [sender, amount0, amount1, liquidity] = event.fields;
						if (
							sender.type !== "Address" ||
							amount0.type !== "U256" ||
							amount1.type !== "U256" ||
							liquidity.type !== "U256"
						) {
							continue;
						}

						newLiquidity.add({
							pairAddress: event.contractAddress,
							userAddress: sender.value,
							amount0: BigInt(amount0.value),
							amount1: BigInt(amount1.value),
							liquidity: BigInt(liquidity.value),
							action: event.eventIndex === 0 ? "Mint" : "Burn",
							timestamp: new Date(block.timestamp),
						});

						processedBlocks.add({
							pluginName: this.PLUGIN_NAME,
							blockHash: block.blockHash,
						});
					} else if (event.fields.length === 6 && event.eventIndex === 2) {
						// const [sender, amount0In, amount1In, amount0Out, amount1Out, to] =
						// 	event.fields;
						// if (
						// 	sender.type !== "Address" ||
						// 	amount0In.type !== "U256" ||
						// 	amount1In.type !== "U256" ||
						// 	amount0Out.type !== "U256" ||
						// 	amount1Out.type !== "U256" ||
						// 	to.type !== "Address"
						// ) {
						// 	continue;
						// }
						// TODO:
						// newSwap.add({
						// 	pairAddress: event.contractAddress,
						// 	userAddress: sender.value,
						// 	amount0: BigInt(amount0.value),
						// 	amount1: BigInt(amount1.value),
						// 	liquidity: BigInt(liquidity.value),
						// 	action: event.eventIndex === 0 ? "Mint" : "Burn",
						// 	timestamp: new Date(block.timestamp),
						// });
						// processedBlocks.add({
						// 	pluginName: this.PLUGIN_NAME,
						// 	blockHash: block.blockHash,
						// });
					}
				}
			}
		}

		// // on LP create, load token0, token1, pair, factory
		return {
			liquidity: Array.from(newLiquidity),
			// swap: Array.from(newSwap),
			// reserves: Array.from(newReserves),
			blocks: Array.from(processedBlocks),
		};
	}

	// insert data
	async insert(trx: Transaction<Database>, data: PluginData) {
		if (!data.liquidity?.length) {
			return;
		}
		// await trx
		// 	.insertInto("PluginLog")
		// 	.values(data.blocks) // throw on conflict
		// 	.execute();

		await trx
			.insertInto("AyinLiquidityEvent")
			.values(data.liquidity)
			.onConflict((col) => col.doNothing())
			.execute();
		return;
	}
}
