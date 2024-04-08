import type { Block } from "../services/sdk/types/block";

import { Plugin } from "../common/plugins/abstract";
import type Database from "../database/schemas/Database";
import type { Transaction } from "kysely";

import type { NewPluginBlock } from "../database/schemas/public/PluginBlock";
import type { NewStakingEvent } from "../database/schemas/public/StakingEvent";
import { db } from "../database/db";

interface PluginData {
	positions: NewStakingEvent[];
	transactions: NewPluginBlock[];
}

const STAKING_CONTRACT = "w7oLoY2txEBb5nzubQqrcdYaiM8NcCL9kMYXY67YfnUo";
const REWARD_TOKEN = "vT49PY8ksoUL6NcXiZ1t2wAmC7tTPRfFfER8n3UCLvXy"; // ayin
const DEPOSIT_TOKEN = "22PUN5TpytzGRXZnzkHViRaWioiGNzdufJH1CxFyQF5Sf"; // alph-alf

export class AyinAlphUsdtPositionPlugin extends Plugin<PluginData> {
	PLUGIN_NAME = "ayin-alph-alf-staking-position";

	startDate = new Date(1692414659280);

	async process(blocks: Block[]) {
		const positions: NewStakingEvent[] = [];

		const inputUsers = Array.from(
			new Set(
				blocks.flatMap((b) =>
					b.transactions.flatMap((t) => t.inputs.map((i) => i.userAddress)),
				),
			),
		);

		const stakingAccountEntries = await db
			.selectFrom("StakingEvent")
			.select(["userAddress", "accountAddress"])
			.where("accountAddress", "is not", null)
			.where("userAddress", "in", inputUsers)
			.execute();

		const stakingAccounts = new Set<string>(
			stakingAccountEntries.map((entry) => entry.accountAddress as string),
		);

		const stakingAccountByUser = new Map<string, string>(
			stakingAccountEntries.map((entry) => [
				entry.userAddress,
				entry.accountAddress as string,
			]),
		);
		const userByStakingAccount = new Map<string, string>(
			stakingAccountEntries.map((entry) => [
				entry.accountAddress as string,
				entry.userAddress,
			]),
		);

		for (const block of blocks) {
			for (const transaction of block.transactions) {
				const transactionHarvests: NewStakingEvent[] = [];
				const transactionDeposits: NewStakingEvent[] = [];
				const transactionWithdraws: NewStakingEvent[] = [];

				const i = new Map<string, Map<string, bigint>>();
				for (const input of transaction.inputs) {
					const prevToken = i.get(input.tokenAddress) ?? new Map();
					const user = prevToken.get(input.userAddress) ?? 0n;
					prevToken.set(input.userAddress, user - input.amount);
					i.set(input.tokenAddress, prevToken);
				}

				for (const output of transaction.outputs) {
					const prevToken = i.get(output.tokenAddress) ?? new Map();
					const user = prevToken.get(output.userAddress) ?? 0n;
					prevToken.set(output.userAddress, user + output.amount);
					i.set(output.tokenAddress, prevToken);
				}

				// staking account creation events
				for (const event of transaction.events) {
					if (event.fields.length === 3) {
						const [one, two, three] = event.fields;
						if (
							one.type === "Address" &&
							two.type === "Address" &&
							three.type === "ByteVec"
						) {
							if (two.value === STAKING_CONTRACT) {
								// one.value is stakingAccountAddress
								// whoever sent 1 alph here is user
								stakingAccounts.add(one.value as string);
							}
						}
					}
				}
				for (const stakingAccount of stakingAccounts) {
					const depositDiff = i.get(DEPOSIT_TOKEN);

					if (depositDiff) {
						const out = depositDiff.get(stakingAccount);

						if (!out) {
							continue;
						}

						if (out > 0n) {
							const inputs = transaction.inputs.find(
								(i) =>
									i.userAddress !== stakingAccount &&
									i.tokenAddress === DEPOSIT_TOKEN &&
									i.amount >= out,
							);

							if (inputs) {
								stakingAccountByUser.set(inputs.userAddress, stakingAccount);
								positions.push({
									accountAddress: stakingAccount,
									action: "deposit",
									amount: out,
									contractAddress: STAKING_CONTRACT,
									timestamp: new Date(block.timestamp),
									tokenAddress: DEPOSIT_TOKEN,
									transaction: transaction.transactionHash,
									userAddress: inputs.userAddress,
								});
							}
						} else if (out < 0n) {
							for (const [user, amount] of depositDiff) {
								if (user === stakingAccount) {
									continue;
								}

								positions.push({
									accountAddress: stakingAccount,
									action: "withdraw",
									amount: out,
									contractAddress: STAKING_CONTRACT,
									timestamp: new Date(block.timestamp),
									tokenAddress: DEPOSIT_TOKEN,
									transaction: transaction.transactionHash,
									userAddress: user,
								});
							}
						}
					}
				}

				const rewardDiff = i.get(REWARD_TOKEN);
				if (rewardDiff) {
					const rewards = rewardDiff.get(STAKING_CONTRACT);
					if (rewards) {
						for (const [user, amount] of rewardDiff) {
							if (user === STAKING_CONTRACT) {
								continue;
							}

							transactionHarvests.push({
								accountAddress: stakingAccountByUser.get(user),
								action: "harvest",
								amount: BigInt(amount),
								contractAddress: STAKING_CONTRACT,
								timestamp: new Date(block.timestamp),
								tokenAddress: REWARD_TOKEN,
								transaction: transaction.transactionHash,
								userAddress: user as string,
							});
						}
					}
				}

				// calculate how much LP user moved from wallet to staking contract
				// calculate how much LP user moved from staking contract to wallet
				// calculate how much rewards moved from staking contract to wallet

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
}
