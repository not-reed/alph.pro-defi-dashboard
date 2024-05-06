import type { Block } from "../services/sdk/types/block";
import { Plugin } from "../common/plugins/abstract";
import type Database from "../database/schemas/Database";
import type { Transaction } from "kysely";
import type { NewPluginBlock } from "../database/schemas/public/PluginBlock";

import type {
	NewSubscription,
	Subscription,
} from "../database/schemas/public/Subscription";
import { db } from "../database/db";

interface SubscriptionData {
	who: string;
	amount: bigint;
	when: number;
	duration: bigint;
}

enum SubscriptionEvent {
	Subscribe = 1,
}

interface PluginData {
	subscriptions: NewSubscription[];
	transactions: NewPluginBlock[];
}

const contract = "wFuF4KgTCXRmpjn7panP2Mimk7B1MLkYXeGDTNy8ahsu";

export class SubscriptionsPlugin extends Plugin<PluginData> {
	PLUGIN_NAME = "subscriptions";

	startDate = new Date(1714678515287);

	async process(blocks: Block[]) {
		const subscriptions: SubscriptionData[] = [];
		const transactions = new Set<string>();

		for (const block of blocks) {
			for (const transaction of block.transactions) {
				if (!transaction.events.length) {
					continue;
				}
				for (const event of transaction.events) {
					if (event.contractAddress !== contract) {
						continue;
					}

					if (event.eventIndex !== SubscriptionEvent.Subscribe) {
						continue;
					}

					const [who, amount, when, duration] = event.fields;

					subscriptions.push({
						who: who.value as string,
						amount: BigInt(amount.value),
						when: Number(when.value.toString()),
						duration: BigInt(duration.value),
					});

					transactions.add(transaction.transactionHash);
				}
			}
		}

		const activeSubs = await this.getActiveSubscriptions(blocks);

		return {
			subscriptions: subscriptions.map((sub) => {
				const activeSub = activeSubs
					.filter((activeSub) => activeSub.userAddress === sub.who)
					.reduce(
						(acc, activeSub) => {
							if (!acc) {
								return activeSub;
							}

							return acc.endAt > activeSub.endAt ? acc : activeSub;
						},
						null as Subscription | null,
					);
				const startAt = activeSub
					? new Date(Math.max(new Date().getTime(), activeSub.endAt.getTime()))
					: new Date();
				return {
					userAddress: sub.who,
					amount: sub.amount,
					startAt: startAt,
					endAt: new Date(startAt.getTime() + Number(sub.duration)),
					timestamp: new Date(sub.when),
				};
			}),
			transactions: Array.from(transactions).map((tx) => ({
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

		await trx.insertInto("Subscription").values(data.subscriptions).execute();
	}

	private async getActiveSubscriptions(blocks: Block[]) {
		const users = new Set<string>();
		for (const block of blocks) {
			for (const transaction of block.transactions) {
				if (!transaction.events.length) {
					continue;
				}
				for (const event of transaction.events) {
					if (event.contractAddress !== contract) {
						continue;
					}

					if (event.eventIndex !== SubscriptionEvent.Subscribe) {
						continue;
					}

					const [who] = event.fields;

					users.add(who.value as string);
				}
			}
		}

		if (!users.size) {
			return [];
		}

		return await db
			.selectFrom("Subscription")
			.selectAll()
			.where("userAddress", "in", Array.from(users))
			.where("endAt", ">", new Date())
			.execute();
	}
}
