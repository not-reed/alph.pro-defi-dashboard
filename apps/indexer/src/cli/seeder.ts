/**
 * Creates fake seeder data for testing and building front end
 * when the backend is not available
 */

import { addressFromContractId } from "@alephium/web3";
import { db } from "../database/db";
import type { NewToken, Token } from "../database/schemas/public/Token";
import type { NewBalance } from "../database/schemas/public/Balance";

function createFakeId() {
	return (
		BigInt(Math.floor(Math.random() * 9999999999999998)) *
		99999999999999999999999999999999999999999999999999999999999999n
	).toString(16);
}

async function seedTokens() {
	const results = await fetch(
		"https://raw.githubusercontent.com/alephium/token-list/master/tokens/mainnet.json",
	).then((a) => a.json());
	console.log({ results });
	if (
		!results ||
		typeof results !== "object" ||
		!("tokens" in results) ||
		!Array.isArray(results.tokens)
	) {
		return;
	}

	const tokens = results.tokens
		.map(
			(t): NewToken => ({
				address: addressFromContractId(t.id),
				symbol: t.symbol,
				name: t.name,
				decimals: t.decimals,
				totalSupply: 0n,
				verified: true,
				description: t.description,
				logo: t.logoURI,
			}),
		)
		.concat(
			Array.from(Array(25).keys()).map((a) => {
				const id = createFakeId();
				return {
					address: addressFromContractId(id),
					symbol: `FAKE_${a}`,
					name: `Fake Token ${a}`,
					decimals: 18,
					totalSupply: 0n,
					verified: false,
				};
			}),
		)
		.concat([
			{
				address: "tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq",
				symbol: "ALPH",
				name: "Alephium",
				decimals: 18,
				totalSupply: 0n,
				verified: true,
				description: null,
				logo: null,
			},
		]);

	await db.insertInto("Token").values(tokens).execute();
}

async function getTokens() {
	const t = await db.selectFrom("Token").selectAll().execute();
	if (t.length) {
		return t;
	}

	await seedTokens();

	return await db.selectFrom("Token").selectAll().execute();
}

async function getPools(tokens: Token[]) {
	const t = await db.selectFrom("Pool").selectAll().execute();
	if (t.length) {
		return t;
	}

	const factory = addressFromContractId(createFakeId());
	for (const token0 of tokens) {
		for (const token1 of tokens) {
			if (token0.id === token1.id) {
				continue;
			}

			const shouldInsert =
				(token0.verified && token1.verified) ||
				((token0.verified || token1.verified) && Math.random() > 0.5) ||
				Math.random() > 0.8;

			if (shouldInsert) {
				const pair = addressFromContractId(createFakeId());
				await db
					.insertInto("Token")
					.values({
						address: pair,
						symbol: `${token0.symbol}${token1.symbol}`,
						name: `${token0.name}-${token1.name}`,
						decimals: 18,
						totalSupply: 0n,
						verified: false,
						description: null,
						logo: null,
					})
					.execute();
				const [pool] = await db
					.insertInto("Pool")
					.values({
						factory,
						pair,
						token0: token0.id,
						token1: token1.id,
					})
					.returningAll()
					.execute();

				await db
					.insertInto("AyinReserve")
					.values({
						pairAddress: pool.pair,
						amount0: BigInt(Math.floor(Math.random() * 1000000)) * 10n ** 18n,
						amount1: BigInt(Math.floor(Math.random() * 1000000)) * 10n ** 18n,
						totalSupply: 0n,
					})
					.returningAll()
					.execute();
			}
		}
	}

	return await db.selectFrom("Pool").selectAll().execute();
}

async function getBalances(addresses: string[]) {
	const b = await db.selectFrom("Balance").selectAll().execute();
	if (b.length) {
		return b;
	}
	const users = Array.from(new Array(500).keys()).map((a) =>
		addressFromContractId(createFakeId()),
	);

	console.log({ allUsers: users });

	for (const address of addresses) {
		const balances = Array.from(new Array(25).keys()).map((a): NewBalance => {
			return {
				userAddress: users[Math.floor(Math.random() * users.length)],
				tokenAddress: address,
				balance:
					BigInt(Math.floor(Math.random() * 100000000000000)) * 10n ** 10n,
			};
		});

		await db.insertInto("Balance").values(balances).execute();
	}
	return await db.selectFrom("Balance").selectAll().execute();
}

export async function runSeeder() {
	// insert verified tokens from github token list
	// insert fake tokens from generated garbage data
	const tokens = await getTokens();
	console.log(`Have ${tokens.length} Tokens`);
	// create some common LP's
	// create some garbage LP's with random token combinations
	const lps = await getPools(tokens);
	console.log(`Have ${lps.length} Pools`);
	// insert a bunch of random balances for these tokens with fake users
	const balances = await getBalances(
		tokens.map((t) => t.address).concat(lps.map((lp) => lp.pair)),
	);
	console.log(`Have ${balances.length} Balances`);
	// save reserves for these LP's
	// save a bunch of random min/burn/swap events for those users
}
