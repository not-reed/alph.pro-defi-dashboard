import cron from "node-cron";

import { toString as parseCron } from "cronstrue";
import { logger } from "../services/logger";
import type { NewCurrentPrice } from "../database/schemas/public/CurrentPrice";
import { db } from "../database/db";
import {
	ALPH_ADDRESS,
	AYIN_ADDRESS,
	EVERY_30_SECONDS,
} from "../core/constants";
import BigNumber from "bignumber.js";
import { config } from "../config";

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
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
async function fetchCoingeckoPrice(): Promise<any> {
	return await fetch(
		"https://api.coingecko.com/api/v3/simple/price?ids=alephium,ayin,bitcoin,ethereum,tether&vs_currencies=usd",
	).then((a) => a.json());
}

export async function updateCoinGeckoPrices() {
	const resp = await fetchCoingeckoPrice();
	coingeckoPrices.alephium = Number(resp.alephium.usd);
	coingeckoPrices.ayin = Number(resp.ayin.usd);
	coingeckoPrices.bitcoin = Number(resp.bitcoin.usd);
	coingeckoPrices.ethereum = Number(resp.ethereum.usd);
	coingeckoPrices.usdt = Number(resp.tether.usd);
}

const coingeckoPrices = {
	alephium: 0,
	ayin: 0,
	bitcoin: 0,
	ethereum: 0,
	usdt: 0,
};

export async function startPricesTask() {
	if (config.INDEXING_DISABLED) {
		logger.info("Prices Task Disabled: Skipping");
		return;
	}

	const schedule = EVERY_30_SECONDS;

	logger.info(`Starting Prices Task: ${parseCron(schedule)}`);

	// run on start and cache prices every 30 seconds
	cron.schedule(
		schedule,
		async () => {
			await updateCoinGeckoPrices();
		},
		{ runOnInit: true },
	);

	cron.schedule(schedule, async () => {
		// fetch prices from coingecko
		// https://api.coingecko.com/api/v3/simple/price?ids=alephium,ayin,bitcoin,ethereum,tether&vs_currencies=usd
		// i.e. {"alephium":{"usd":3.0},"ayin":{"usd":16.2},"bitcoin":{"usd":50921},"ethereum":{"usd":2924.58},"tether":{"usd":1.001}}
		if (!coingeckoPrices.alephium) {
			logger.warn("No coingecko price data, skipping");
			return;
		}

		await saveCoingeckoPrices();
	});

	cron.schedule(schedule, async () => {
		// fetch prices from coingecko
		// https://api.coingecko.com/api/v3/simple/price?ids=alephium,ayin,bitcoin,ethereum,tether&vs_currencies=usd
		// i.e. {"alephium":{"usd":3.0},"ayin":{"usd":16.2},"bitcoin":{"usd":50921},"ethereum":{"usd":2924.58},"tether":{"usd":1.001}}
		if (!coingeckoPrices.alephium) {
			logger.warn("No coingecko price data, skipping");
			return;
		}

		await saveOnChainPrices();
	});
}

export async function saveCoingeckoPrices() {
	savePrices([
		{
			address: ALPH_ADDRESS, // alph
			price: BigInt(coingeckoPrices.alephium * 1e18),
			liquidity: null, // used to determine weight of price source
			source: "coingecko", // coingecko | ayin
			sourceKey: "alephium", // pairAddress, coingecko id, etc
			timestamp: new Date(),
		},
		{
			address: "vT49PY8ksoUL6NcXiZ1t2wAmC7tTPRfFfER8n3UCLvXy", // ayin
			price: BigInt(coingeckoPrices.ayin * 1e18),
			liquidity: null, // used to determine weight of price source
			source: "coingecko", // coingecko | ayin
			sourceKey: "ayin", // pairAddress, coingecko id, etc
			timestamp: new Date(),
		},
		{
			address: "xUTp3RXGJ1fJpCGqsAY6GgyfRQ3WQ1MdcYR1SiwndAbR", // btc
			price: BigInt(coingeckoPrices.bitcoin * 1e18),
			liquidity: null, // used to determine weight of price source
			source: "coingecko", // coingecko | ayin
			sourceKey: "bitcoin", // pairAddress, coingecko id, etc
			timestamp: new Date(),
		},
		{
			address: "vP6XSUyjmgWCB2B9tD5Rqun56WJqDdExWnfwZVEqzhQb", // eth
			price: BigInt(coingeckoPrices.ethereum * 1e18),
			liquidity: null, // used to determine weight of price source
			source: "coingecko", // coingecko | ayin
			sourceKey: "ethereum", // pairAddress, coingecko id, etc
			timestamp: new Date(),
		},
		{
			address: "zSRgc7goAYUgYsEBYdAzogyyeKv3ne3uvWb3VDtxnaEK", // usdt
			price: BigInt(coingeckoPrices.usdt * 1e18),
			liquidity: null, // used to determine weight of price source
			source: "coingecko", // coingecko | ayin
			sourceKey: "tether", // pairAddress, coingecko id, etc
			timestamp: new Date(),
		},
	]);
}

export async function saveOnChainPrices() {
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
		if (decimal0 === undefined || decimal1 === undefined) {
			logger.warn("tokens missing decimals");
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
			.multipliedBy(coingeckoPrices.alephium);

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
			price: BigInt(price0.multipliedBy(1e18).toFixed(0)),
			liquidity: BigInt(
				new BigNumber(pool.amount0.toString())
					.dividedBy(10 ** decimal0)
					.multipliedBy(price0)
					.multipliedBy(1e18)
					.toFixed(0),
			),
			timestamp,
		});

		tokenPrices.push({
			address: pool.token1,
			source: "ayin",
			sourceKey: pool.pair,
			price: BigInt(price1.multipliedBy(1e18).toFixed(0)),
			liquidity: BigInt(
				new BigNumber(pool.amount1.toString())
					.dividedBy(10 ** decimal1)
					.multipliedBy(price1)
					.multipliedBy(1e18)
					.toFixed(0),
			),
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

		// skip pools with 0 reserves
		if (!pool.amount0 || !pool.amount1) {
			continue;
		}

		const decimal0 = decimals.get(pool.token0);
		const decimal1 = decimals.get(pool.token1);
		if (decimal0 === undefined || decimal1 === undefined) {
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
				.multipliedBy(new BigNumber(source.price.toString()).dividedBy(1e18));

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
				price: BigInt(price0.multipliedBy(1e18).toFixed(0)),
				liquidity: BigInt(
					new BigNumber(pool.amount0.toString())
						.dividedBy(10 ** decimal0)
						.multipliedBy(price0)
						.multipliedBy(1e18)
						.toFixed(0),
				),
				timestamp,
			});

			tokenPrices.push({
				address: pool.token1,
				source: "ayin",
				sourceKey: pool.pair,
				price: BigInt(price1.multipliedBy(1e18).toFixed(0)),
				liquidity: BigInt(
					new BigNumber(pool.amount1.toString())
						.dividedBy(10 ** decimal1)
						.multipliedBy(price1)
						.multipliedBy(1e18)
						.toFixed(0),
				),
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
				.multipliedBy(new BigNumber(source.price.toString()).dividedBy(1e18));

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
				price: BigInt(price0.multipliedBy(1e18).toFixed(0)),
				liquidity: BigInt(
					new BigNumber(pool.amount0.toString())
						.dividedBy(10 ** decimal0)
						.multipliedBy(price0)
						.multipliedBy(1e18)
						.toFixed(0),
				),
				timestamp,
			});

			tokenPrices.push({
				address: pool.token1,
				source: "ayin",
				sourceKey: pool.pair,
				price: BigInt(price1.multipliedBy(1e18).toFixed(0)),
				liquidity: BigInt(
					new BigNumber(pool.amount1.toString())
						.dividedBy(10 ** decimal1)
						.multipliedBy(price1)
						.multipliedBy(1e18)
						.toFixed(0),
				),
				timestamp,
			});
		}
	}

	await savePrices(tokenPrices);
}
