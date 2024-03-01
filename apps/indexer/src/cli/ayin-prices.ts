import { ALPH_ADDRESS } from "../core/constants";
import { db } from "../database/db";
import type { NewCurrentPrice } from "../database/schemas/public/CurrentPrice";
import type { ContractAddress } from "../services/common/types/brands";
import BigNumber from "bignumber.js";
import { logger } from "../services/logger";

// async function fetchCoingeckoPrice(): Promise<any> {
// 	return await fetch(
// 		"https://api.coingecko.com/api/v3/simple/price?ids=alephium,ayin,bitcoin,ethereum,tether&vs_currencies=usd",
// 	).then((a) => a.json());
// }

const AYIN_ADDRESS =
	"vT49PY8ksoUL6NcXiZ1t2wAmC7tTPRfFfER8n3UCLvXy" as ContractAddress;

const coingeckoPrices = {
	[ALPH_ADDRESS]: 3.39,
	[AYIN_ADDRESS]: 26.68, // ayin
	xUTp3RXGJ1fJpCGqsAY6GgyfRQ3WQ1MdcYR1SiwndAbR: 61904,
	vP6XSUyjmgWCB2B9tD5Rqun56WJqDdExWnfwZVEqzhQb: 3418.07,
	zSRgc7goAYUgYsEBYdAzogyyeKv3ne3uvWb3VDtxnaEK: 0.999371,
};

export async function getAyinPrices() {
	const timestamp = new Date();
	const tokens = await db.selectFrom("Token").selectAll().execute();
	const pools = await db
		.selectFrom("Pool")
		.leftJoin("AyinReserve", (join) =>
			join.onRef("AyinReserve.pairAddress", "=", "Pool.pair"),
		)
		.select(["pair", "token0", "token1", "amount0", "amount1", "totalSupply"])
		.execute();

	const alphAyin = pools.find(
		(pool) => pool.token0 === ALPH_ADDRESS && pool.token1 === AYIN_ADDRESS,
	);
	if (!alphAyin?.amount0 || !alphAyin?.amount1) {
		throw new Error("Alph/Ayin pool not found");
	}

	const tokenPrices: NewCurrentPrice[] = [];
	const alphPools = pools.filter((pool) => pool.token0 === ALPH_ADDRESS);
	const nonAlphPools = pools.filter((pool) => pool.token0 !== ALPH_ADDRESS);
	const decimals = new Map(tokens.map((t) => [t.address, t.decimals]));
	// get all alph pools first
	for (const pool of alphPools) {
		if (!pool.amount0 || !pool.amount1) {
			continue;
		}

		const decimal0 = decimals.get(pool.token0);
		const decimal1 = decimals.get(pool.token1);
		if (!decimal0 || !decimal1) {
			continue;
		}

		const price1 = new BigNumber(
			new BigNumber(pool.amount0.toString())
				.dividedBy(10 ** decimal0)
				.toString(),
		)
			.dividedBy(
				new BigNumber(pool.amount1.toString())
					.dividedBy(10 ** decimal1)
					.toString(),
			)
			.multipliedBy(coingeckoPrices[ALPH_ADDRESS]);

		const price0 = new BigNumber(
			new BigNumber(pool.amount1.toString())
				.dividedBy(10 ** decimal1)
				.toString(),
		)
			.dividedBy(
				new BigNumber(pool.amount0.toString())
					.dividedBy(10 ** decimal0)
					.toString(),
			)
			.multipliedBy(price1.toString());

		tokenPrices.push({
			address: pool.token0,
			source: "ayin",
			sourceKey: pool.pair,
			price: price0.toNumber(),
			liquidity: new BigNumber(pool.amount0.toString())
				.dividedBy(10 ** decimal0)
				.multipliedBy(price0)
				.toNumber(),
			timestamp,
		});

		tokenPrices.push({
			address: pool.token1,
			source: "ayin",
			sourceKey: pool.pair,
			price: price1.toNumber(),
			liquidity: new BigNumber(pool.amount1.toString())
				.dividedBy(10 ** decimal1)
				.multipliedBy(price1)
				.toNumber(),

			timestamp,
		});
	}

	for (const pool of nonAlphPools) {
		// use this as base price of pool (token0, or token1)
		const source = tokenPrices
			.filter(
				(price) =>
					price.address === pool.token0 || price.address === pool.token1,
			)
			.sort((a, b) => {
				if (!a.liquidity && !b.liquidity) {
					return 0;
				}

				if (!a.liquidity) {
					return 1;
				}

				if (!b.liquidity) {
					return -1;
				}
				return a.liquidity > b.liquidity ? -1 : 1;
			})
			.find(Boolean);

		if (!source) {
			logger.warn(`Could not find price source for pool ${pool.pair}`);
			continue;
		}

		if (!pool.amount0 || !pool.amount1) {
			logger.warn(`pool missing reserves ${pool.pair}`);
			continue;
		}

		const decimal0 = decimals.get(pool.token0);
		const decimal1 = decimals.get(pool.token1);
		if (!decimal0 || !decimal1) {
			logger.warn("tokens missing decimals");
			continue;
		}

		if (pool.token0 === source.address) {
			const price1 = new BigNumber(
				new BigNumber(pool.amount0.toString())
					.dividedBy(10 ** decimal0)
					.toString(),
			)
				.dividedBy(
					new BigNumber(pool.amount1.toString())
						.dividedBy(10 ** decimal1)
						.toString(),
				)
				.multipliedBy(source.price);

			const price0 = new BigNumber(
				new BigNumber(pool.amount1.toString())
					.dividedBy(10 ** decimal1)
					.toString(),
			)
				.dividedBy(
					new BigNumber(pool.amount0.toString())
						.dividedBy(10 ** decimal0)
						.toString(),
				)
				.multipliedBy(price1.toString());

			tokenPrices.push({
				address: pool.token0,
				source: "ayin",
				sourceKey: pool.pair,
				price: price0.toNumber(),
				liquidity: new BigNumber(pool.amount0.toString())
					.dividedBy(10 ** decimal0)
					.multipliedBy(price0)
					.toNumber(),
				timestamp,
			});

			tokenPrices.push({
				address: pool.token1,
				source: "ayin",
				sourceKey: pool.pair,
				price: price1.toNumber(),
				liquidity: new BigNumber(pool.amount1.toString())
					.dividedBy(10 ** decimal1)
					.multipliedBy(price1)
					.toNumber(),

				timestamp,
			});
		} else if (pool.token1 === source.address) {
			const price0 = new BigNumber(
				new BigNumber(pool.amount1.toString())
					.dividedBy(10 ** decimal1)
					.toString(),
			)
				.dividedBy(
					new BigNumber(pool.amount0.toString())
						.dividedBy(10 ** decimal0)
						.toString(),
				)
				.multipliedBy(source.price);

			const price1 = new BigNumber(
				new BigNumber(pool.amount0.toString())
					.dividedBy(10 ** decimal0)
					.toString(),
			)
				.dividedBy(
					new BigNumber(pool.amount1.toString())
						.dividedBy(10 ** decimal1)
						.toString(),
				)
				.multipliedBy(price0.toString());

			tokenPrices.push({
				address: pool.token0,
				source: "ayin",
				sourceKey: pool.pair,
				price: price0.toNumber(),
				liquidity: new BigNumber(pool.amount0.toString())
					.dividedBy(10 ** decimal0)
					.multipliedBy(price0)
					.toNumber(),
				timestamp,
			});

			tokenPrices.push({
				address: pool.token1,
				source: "ayin",
				sourceKey: pool.pair,
				price: price1.toNumber(),
				liquidity: new BigNumber(pool.amount1.toString())
					.dividedBy(10 ** decimal1)
					.multipliedBy(price1)
					.toNumber(),

				timestamp,
			});
		}
	}

	console.log({
		prices: tokenPrices.filter((a) =>
			[
				"2535B6wgHEF299ePEWdnVdbBsxrxvXzpjj8YzHuMp6QGf",
				"yqxv1UFaeGVwV8M5Yd6A9A2je3w4Xw4uKU2SxDQW9aVM",
				"w1qtoyjpzpwruPWN54rzR6cmHGMUDtik7URJ5E8284fq",
			].includes(a.sourceKey),
		),
	});
	await savePrices(tokenPrices);
}

async function savePrices(prices: NewCurrentPrice[]): Promise<void> {
	logger.info("Saving Prices");
	await db
		.insertInto("CurrentPrice")
		.values(prices)
		.onConflict((col) =>
			col.columns(["address", "source", "sourceKey"]).doUpdateSet((eb) => ({
				price: eb.ref("excluded.price"),
				liquidity: eb.ref("excluded.liquidity"),
				timestamp: eb.ref("excluded.timestamp"),
			})),
		)
		.execute();
}
