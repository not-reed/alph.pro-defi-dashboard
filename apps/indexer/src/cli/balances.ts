import { sql } from "kysely";
import { db } from "../database/db";
import { config } from "../config";
import { addressFromContractId } from "@alephium/web3";
import type { NewBalance } from "../database/schemas/public/Balance";
import {
	deleteUserBalances,
	insertUserBalances,
} from "../database/services/balance";

const nodeHeaders: Record<string, string> = { Accept: "application/json" };

if (config.NODE_BASIC_AUTH) {
	nodeHeaders.Authorization = `Basic ${config.NODE_BASIC_AUTH}`;
}

if (config.NODE_API_KEY) {
	nodeHeaders["X-API-KEY"] = config.NODE_API_KEY;
}

export async function fixBalances(opts: {
	user?: string;
	token?: string;
	notToken?: string;
	min?: number;
	max?: number;
	minBalance?: bigint;
	maxBalance?: bigint;
	force?: boolean;
	//
	logger?: boolean;
}) {
	let query = db
		.selectFrom("Balance")
		.select(["userAddress", (eb) => eb.fn.count("tokenAddress").as("count")]);

	if (opts.user !== undefined) {
		query = query.where("Balance.userAddress", "=", opts.user);
	}

	if (opts.token !== undefined) {
		query = query.where("Balance.tokenAddress", "=", opts.token);
	}

	if (opts.notToken !== undefined) {
		query = query.where(({ eb, or, and, selectFrom }) =>
			and([
				or([
					eb(
						"tokenAddress",
						"in",
						selectFrom("Token")
							.select("address")
							.where("address", "<>", opts.notToken as string),
					),
					eb(
						"tokenAddress",
						"in",
						selectFrom("Nft")
							.select("address")
							.where("address", "<>", opts.notToken as string),
					),
				]),
			]),
		);
	}

	if (opts.minBalance !== undefined) {
		query = query.where("balance", ">=", opts.minBalance);
	}

	if (opts.maxBalance !== undefined) {
		query = query.where("balance", "<=", opts.maxBalance);
	}

	query = query.groupBy("userAddress");

	if (opts.min !== undefined) {
		query = query.having(sql`count(distinct "tokenAddress")`, ">=", opts.min);
	}

	if (opts.max !== undefined) {
		query = query.having(sql`count(distinct "tokenAddress")`, "<=", opts.max);
	}

	const users = await query.orderBy("userAddress", "asc").execute();

	const unique = Array.from(new Set(users.map((u) => u.userAddress)));

	if (opts.logger) {
		console.log(
			`Found ${users.length}/${unique.length} users with matching balances`,
		);
	}

	for (const user of users) {
		const balances = await fetch(
			`${config.NODE_URL}/addresses/${user.userAddress}/balance`,
			{ headers: nodeHeaders },
		).then((a) => a.json());

		const wallet = []
			.concat(balances.tokenBalances ?? [])
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
			BigInt(balances.balance || 0),
		);

		if (BigInt(wallet.size) === user.count && !opts.force) {
			continue;
		}

		const newBalances: NewBalance[] = [];
		for (const [addr, bal] of wallet) {
			newBalances.push({
				userAddress: user.userAddress,
				tokenAddress: addr,
				balance: bal,
			});
		}

		console.log({ newBalances });
		await db.transaction().execute(async (trx) => {
			await deleteUserBalances(user.userAddress, trx);
			await insertUserBalances(newBalances, trx);
		});

		if (opts.logger) {
			console.log(
				`Fixed ${user.userAddress} balances (${newBalances.length} tokens)`,
			);
		}
	}
}
