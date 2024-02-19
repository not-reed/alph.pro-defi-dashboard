import type { Block } from "../services/sdk/types/block";

import { Plugin } from "../common/plugins/abstract";
import type Database from "../database/schemas/Database";
import type { Transaction } from "kysely";

import { db } from "../database/db";
import type { NewPluginBlock } from "../database/schemas/public/PluginBlock";

import type { NewAyinSwap } from "../database/schemas/public/AyinSwap";

import type { NewAyinLiquidityEvent } from "../database/schemas/public/AyinLiquidityEvent";
import type {
	AyinReserve,
	NewAyinReserve,
} from "../database/schemas/public/AyinReserve";
import type {
	BlockHash,
	ContractAddress,
} from "../services/common/types/brands";
import { logger } from "../services/logger";

interface PluginData {
	liquidity: NewAyinLiquidityEvent[];
	swap: NewAyinSwap[];
	reserves: NewAyinReserve[];
	blocks: NewPluginBlock[];
}

function newAyinReserve(pairAddress: ContractAddress) {
	return {
		pairAddress: pairAddress,
		amount0: BigInt(0),
		amount1: BigInt(0),
		totalSupply: BigInt(0),
	} satisfies NewAyinReserve;
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
			return { liquidity: [], blocks: [], swap: [], reserves: [] };
		}

		const reserves = await db
			.selectFrom("AyinReserve")
			.selectAll()
			.where("pairAddress", "in", Array.from(contractEvents))
			.execute();

		const reserveMap = new Map<string, AyinReserve | NewAyinReserve>(
			reserves.map((reserve) => [reserve.pairAddress, reserve]),
		);

		const processedBlocks = new Set<BlockHash>();
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
							transactionHash: transaction.transactionHash,
						});

						const reserve =
							reserveMap.get(event.contractAddress) ??
							newAyinReserve(event.contractAddress);

						// update reserves from swap
						if (event.eventIndex === 0) {
							// mint
							reserve.amount0 += BigInt(amount0.value);
							reserve.amount1 += BigInt(amount1.value);
							reserve.totalSupply += BigInt(liquidity.value);
						} else {
							// burn
							reserve.amount0 -= BigInt(amount0.value);
							reserve.amount1 -= BigInt(amount1.value);
							reserve.totalSupply -= BigInt(liquidity.value);
						}

						reserveMap.set(event.contractAddress, reserve);

						processedBlocks.add(block.blockHash);
					} else if (event.fields.length === 6 && event.eventIndex === 2) {
						const [sender, amount0In, amount1In, amount0Out, amount1Out, to] =
							event.fields;
						if (
							sender.type !== "Address" ||
							amount0In.type !== "U256" ||
							amount1In.type !== "U256" ||
							amount0Out.type !== "U256" ||
							amount1Out.type !== "U256" ||
							to.type !== "Address"
						) {
							continue;
						}
						newSwap.add({
							pairAddress: event.contractAddress,
							userAddress: sender.value,
							amount0: BigInt(amount0In.value) - BigInt(amount0Out.value),
							amount1: BigInt(amount1In.value) - BigInt(amount1Out.value),
							timestamp: new Date(block.timestamp),
							transactionHash: transaction.transactionHash,
						});

						const reserve =
							reserveMap.get(event.contractAddress) ??
							newAyinReserve(event.contractAddress);

						// update reserves from swap
						reserve.amount0 +=
							BigInt(amount0In.value) - BigInt(amount0Out.value);
						reserve.amount1 +=
							BigInt(amount1In.value) - BigInt(amount1Out.value);
						reserveMap.set(event.contractAddress, reserve);

						processedBlocks.add(block.blockHash);
					}
				}
			}
		}

		// // on LP create, load token0, token1, pair, factory
		return {
			liquidity: Array.from(newLiquidity),
			swap: Array.from(newSwap),
			reserves: Array.from(reserveMap.values()),
			blocks: Array.from(processedBlocks).map((hash) => ({
				blockHash: hash,
				pluginName: this.PLUGIN_NAME,
			})),
		};
	}

	// insert data
	async insert(trx: Transaction<Database>, data: PluginData) {
		if (!data.blocks?.length) {
			return;
		}

		await trx
			.insertInto("PluginBlock")
			.values(data.blocks) // throw on conflict
			.execute();

		if (data.liquidity?.length) {
			await trx
				.insertInto("AyinLiquidityEvent")
				.values(data.liquidity)
				.execute();
		}

		if (data.swap?.length) {
			await trx.insertInto("AyinSwap").values(data.swap).execute();
		}

		if (data.reserves?.length) {
			await trx
				.insertInto("AyinReserve")
				.values(data.reserves)
				.onConflict((col) =>
					col.column("pairAddress").doUpdateSet((eb) => ({
						amount0: eb.ref("excluded.amount0"),
						amount1: eb.ref("excluded.amount1"),
						totalSupply: eb.ref("excluded.totalSupply"),
					})),
				)
				.execute();
		}
		return;
	}
}
