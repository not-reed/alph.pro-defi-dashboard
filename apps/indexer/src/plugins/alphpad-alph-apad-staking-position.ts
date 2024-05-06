import type { Block } from "../services/sdk/types/block";
import type Database from "../database/schemas/Database";
import type { Transaction } from "kysely";
import type { NewPluginBlock } from "../database/schemas/public/PluginBlock";
import type { NewStakingEvent } from "../database/schemas/public/StakingEvent";
import { addressFromContractId } from "@alephium/web3";
import { Plugin } from "../common/plugins/abstract";
import { db } from "../database/db";

interface PluginData {
	positions: NewStakingEvent[];
	transactions: NewPluginBlock[];
}

const STAKING_CONTRACT = "yzoCumd4Fpi959NSis9Nnyr28UkgyRYqrKBgYNAuYj3m";
const REWARD_TOKEN = "27HxXZJBTPjhHXwoF1Ue8sLMcSxYdxefoN2U6d8TKmZsm";
const LP_TOKEN = "vFpZ1DF93x1xGHoXM8rsDBFjpcoSsCi5ZEuA5NG5UJGX";

enum StakingEvent {
	AccountCreate = 0,
	AccountDestroy = 1,
	Stake = 8,
	Unstake = 9,
	Withdraw = 10,
	// Claim = 11, // claim presale tokens maybe?
	DepositReward = 12,
	ClaimReward = 13,
}

export class AlphpadAlphApadStakingPositionPlugin extends Plugin<PluginData> {
	PLUGIN_NAME = "alphpad-alph-apad-staking-position";

	startDate = new Date(1713113529776);

	async process(blocks: Block[]) {
		const positions: NewStakingEvent[] = [];

		const userAddresses = this.getUserAddressesFromBlockEvents(blocks);

		// userAddress => accountAddress
		const accounts = new Map<string, string>();

		const existing = userAddresses.length
			? await db
					.selectFrom("StakingEvent")
					.select(["userAddress", "accountAddress"])
					.where("accountAddress", "is not", null)
					.where("userAddress", "in", userAddresses)
					.distinct()
					.execute()
			: [];

		for (const found of existing) {
			if (found.accountAddress) {
				accounts.set(found.userAddress, found.accountAddress);
			}
		}

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

					if (event.eventIndex === StakingEvent.AccountCreate) {
						accounts.set(
							event.fields[0].value as string,
							addressFromContractId(event.fields[1].value as string),
						);

						transactionDeposits.push({
							transaction: transaction.transactionHash,
							timestamp: new Date(block.timestamp),
							userAddress: event.fields[0].value as string,
							accountAddress: accounts.get(event.fields[0].value as string),
							contractAddress: STAKING_CONTRACT,
							amount: 0n, // create account
							tokenAddress: LP_TOKEN,
							action: "deposit",
						});
					}

					if (event.eventIndex === StakingEvent.Stake) {
						transactionDeposits.push({
							transaction: transaction.transactionHash,
							timestamp: new Date(block.timestamp),
							userAddress: event.fields[0].value as string,
							accountAddress: accounts.get(event.fields[0].value as string),
							contractAddress: STAKING_CONTRACT,
							amount: BigInt(event.fields[1].value),
							tokenAddress: LP_TOKEN,
							action: "deposit",
						});
					}

					if (
						[StakingEvent.Withdraw, StakingEvent.Unstake].includes(
							event.eventIndex,
						)
					) {
						transactionWithdraws.push({
							transaction: transaction.transactionHash,
							timestamp: new Date(block.timestamp),
							userAddress: event.fields[0].value as string,
							accountAddress: accounts.get(event.fields[0].value as string),
							contractAddress: STAKING_CONTRACT,
							amount: BigInt(event.fields[1].value) * -1n,
							tokenAddress: LP_TOKEN,
							action: "withdraw",
						});
					}

					if ([StakingEvent.ClaimReward].includes(event.eventIndex)) {
						transactionHarvests.push({
							transaction: transaction.transactionHash,
							timestamp: new Date(block.timestamp),
							userAddress: event.fields[0].value as string,
							accountAddress: accounts.get(event.fields[0].value as string),
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
	}

	private getUserAddressesFromBlockEvents(blocks: Block[]) {
		const userAddresses = new Set<string>();

		const events = [
			StakingEvent.AccountCreate,
			StakingEvent.Stake,
			StakingEvent.Withdraw,
			StakingEvent.Unstake,
			StakingEvent.ClaimReward,
		];

		for (const block of blocks) {
			for (const transaction of block.transactions) {
				if (!transaction.events.length) {
					continue;
				}
				for (const event of transaction.events) {
					if (![STAKING_CONTRACT].includes(event.contractAddress)) {
						continue;
					}

					if (events.includes(event.eventIndex)) {
						userAddresses.add(event.fields[0].value as string);
					}
				}
			}
		}

		return Array.from(userAddresses);
	}
}
