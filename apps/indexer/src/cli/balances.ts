import { sql } from "kysely";
import { db } from "../database/db";
import { config } from "../config";
import { addressFromContractId } from "@alephium/web3";

const nodeHeaders: Record<string, string> = { Accept: "application/json" };

if (config.NODE_BASIC_AUTH) {
	nodeHeaders.Authorization = `Basic ${config.NODE_BASIC_AUTH}`;
}

if (config.NODE_API_KEY) {
	nodeHeaders["X-API-KEY"] = config.NODE_API_KEY;
}

export async function fixBalances(opts: {
	user: string;
	min: number;
	max: number;
}) {
	let query = db
		.selectFrom("Balance")
		.select(["userAddress", (eb) => eb.fn.count("tokenAddress").as("count")])
		.where("balance", "<>", 0n);
	if (opts.user) {
		query = query.where("Balance.userAddress", "=", opts.user);
	}
	query = query.groupBy("userAddress");

	if (opts.min) {
		query = query.having(sql`count(distinct "tokenAddress")`, ">=", opts.min);
	}

	if (opts.max) {
		query = query.having(sql`count(distinct "tokenAddress")`, "<=", opts.max);
	}

	const users = await query
		.orderBy(sql`count(distinct "tokenAddress")`, "desc")
		.execute();

	console.log(`Found ${users.length} users with non-zero balances`);

	for (const user of users) {
		const balances = await fetch(
			`${config.NODE_URL}/addresses/${user.userAddress}/balance`,
			{ headers: nodeHeaders },
		).then((a) => a.json());

		const wallet = []
			.concat(balances.tokenBalances ?? [])
			.concat(balances.lockedTokenBalances ?? [])
			.reduce(
				(
					acc: Map<string, bigint>,
					cur: { id: string; amount: `${number}` },
				) => {
					try {
						const address = addressFromContractId(cur.id);
						const prev = acc.get(address);
						if (prev) {
							acc.set(address, prev + BigInt(cur.amount));
						} else {
							acc.set(address, BigInt(cur.amount));
						}
						return acc;
					} catch (err) {
						console.log({ cur, user });
						throw err;
					}
				},
				new Map<string, bigint>(),
			);

		wallet.set(
			"tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq",
			BigInt(balances.balance) + BigInt(balances.lockedBalance),
		);

		if (BigInt(wallet.size) === user.count) {
			continue;
		}

		await db.transaction().execute(async (trx) => {
			await trx
				.updateTable("Balance")
				.set("balance", 0n)
				.where("userAddress", "=", user.userAddress)
				.execute();

			for (const [addr, bal] of wallet) {
				await trx
					.insertInto("Balance")
					.values({
						userAddress: user.userAddress,
						tokenAddress: addr,
						balance: bal,
					})
					.onConflict((oc) =>
						oc.columns(["userAddress", "tokenAddress"]).doUpdateSet({
							balance: (eb) => eb.ref("excluded.balance"),
						}),
					)
					.execute();
			}
		});

		console.log(`Fixed ${user.userAddress} balances`);
	}
}
