import type { Block } from "../services/sdk/types/block";

import type { NewPluginBlock } from "../database/schemas/public/PluginBlock";
import type { NewStakingEvent } from "../database/schemas/public/StakingEvent";
import { db } from "../database/db";

interface PluginData {
	positions: NewStakingEvent[];
	transactions: NewPluginBlock[];
}

export async function processStakingContractForBlocks(
	stakingContract: string,
	depositToken: string,
	rewardToken: string,
	pluginName: string,
	blocks: Block[],
): Promise<PluginData> {
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
		.distinct()
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
			const balanceDiffByToken = new Map<string, Map<string, bigint>>();
			for (const input of transaction.inputs) {
				const prevToken =
					balanceDiffByToken.get(input.tokenAddress) ?? new Map();
				const user = prevToken.get(input.userAddress) ?? 0n;
				prevToken.set(input.userAddress, user - input.amount);
				balanceDiffByToken.set(input.tokenAddress, prevToken);
			}

			for (const output of transaction.outputs) {
				const prevToken =
					balanceDiffByToken.get(output.tokenAddress) ?? new Map();
				const user = prevToken.get(output.userAddress) ?? 0n;
				prevToken.set(output.userAddress, user + output.amount);
				balanceDiffByToken.set(output.tokenAddress, prevToken);
			}

			// staking account creation events
			for (const event of transaction.events) {
				if (!balanceDiffByToken.has(depositToken)) {
					break;
				}

				if (event.fields.length === 3) {
					const [one, two, three] = event.fields;
					if (
						one.type === "Address" &&
						two.type === "Address" &&
						three.type === "ByteVec"
					) {
						if (two.value === stakingContract) {
							// one.value is stakingAccountAddress
							// whoever sent 1 alph here is user
							stakingAccounts.add(one.value as string);
						}
					}
				}
			}

			for (const stakingAccount of stakingAccounts) {
				const depositDiff = balanceDiffByToken.get(depositToken);
				if (!depositDiff) {
					break;
				}

				const out = depositDiff.get(stakingAccount);
				if (!out) {
					continue;
				}

				if (out > 0n) {
					const inputs = Array.from(
						transaction.inputs
							.reduce((acc, cur) => {
								const key = `${cur.tokenAddress}-${cur.userAddress}`;
								const prev = acc.get(key) ?? {
									userAddress: cur.userAddress,
									tokenAddress: cur.tokenAddress,
									amount: 0n,
								};
								prev.amount += cur.amount;
								return acc.set(key, prev);
							}, new Map())
							.values(),
					).find(
						(i) =>
							i.userAddress !== stakingAccount &&
							i.tokenAddress === depositToken &&
							i.amount >= out,
					);

					if (inputs) {
						stakingAccountByUser.set(inputs.userAddress, stakingAccount);
						positions.push({
							accountAddress: stakingAccount,
							action: "deposit",
							amount: out,
							contractAddress: stakingContract,
							timestamp: new Date(block.timestamp),
							tokenAddress: depositToken,
							transaction: transaction.transactionHash,
							userAddress: inputs.userAddress,
						});
					}
				} else if (out < 0n) {
					for (const [user, amount] of depositDiff) {
						if (user === stakingAccount) {
							continue;
						}
						stakingAccountByUser.set(user, stakingAccount);
						positions.push({
							accountAddress: stakingAccount,
							action: "withdraw",
							amount: out,
							contractAddress: stakingContract,
							timestamp: new Date(block.timestamp),
							tokenAddress: depositToken,
							transaction: transaction.transactionHash,
							userAddress: user,
						});
					}
				}
			}

			const rewardDiff = balanceDiffByToken.get(rewardToken);
			if (rewardDiff) {
				const rewards = rewardDiff.get(stakingContract);
				if (rewards) {
					for (const [user, amount] of rewardDiff) {
						if (user === stakingContract) {
							continue;
						}

						transactionHarvests.push({
							accountAddress: stakingAccountByUser.get(user),
							action: "harvest",
							amount: BigInt(amount),
							contractAddress: stakingContract,
							timestamp: new Date(block.timestamp),
							tokenAddress: rewardToken,
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
		transactions: Array.from(new Set(positions.map((p) => p.transaction))).map(
			(tx) => ({
				blockHash: tx,
				pluginName,
			}),
		),
	};
}
