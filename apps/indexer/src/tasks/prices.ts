import cron from "node-cron";
import { EVERY_30_SECONDS } from "./schedules";
import { toString as parseCron } from "cronstrue";
import { logger } from "../services/logger";
import type { NewCurrentPrice } from "../database/schemas/public/CurrentPrice";
import { db } from "../database/db";

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
async function fetchPrice(): Promise<any> {
	return await fetch(
		"https://api.coingecko.com/api/v3/simple/price?ids=alephium,ayin,bitcoin,ethereum,tether&vs_currencies=usd",
	).then((a) => a.json());
}

export async function startPricesTask() {
	const schedule = EVERY_30_SECONDS;

	logger.info(`Starting Prices Task: ${parseCron(schedule)}`);

	cron.schedule(schedule, async () => {
		// fetch prices from coingecko
		// https://api.coingecko.com/api/v3/simple/price?ids=alephium,ayin,bitcoin,ethereum,tether&vs_currencies=usd
		// i.e. {"alephium":{"usd":3.0},"ayin":{"usd":16.2},"bitcoin":{"usd":50921},"ethereum":{"usd":2924.58},"tether":{"usd":1.001}}

		const resp = await fetchPrice();

		savePrices([
			{
				address: "tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq", // alph
				price: Number(resp.alephium.usd),
				liquidity: null, // used to determine weight of price source
				source: "coingecko", // coingecko | ayin
				sourceKey: "alephium", // pairAddress, coingecko id, etc
				timestamp: new Date(),
			},
			{
				address: "vT49PY8ksoUL6NcXiZ1t2wAmC7tTPRfFfER8n3UCLvXy", // ayin
				price: Number(resp.ayin.usd),
				liquidity: null, // used to determine weight of price source
				source: "coingecko", // coingecko | ayin
				sourceKey: "ayin", // pairAddress, coingecko id, etc
				timestamp: new Date(),
			},
			{
				address: "xUTp3RXGJ1fJpCGqsAY6GgyfRQ3WQ1MdcYR1SiwndAbR", // ayin
				price: Number(resp.bitcoin.usd),
				liquidity: null, // used to determine weight of price source
				source: "coingecko", // coingecko | ayin
				sourceKey: "bitcoin", // pairAddress, coingecko id, etc
				timestamp: new Date(),
			},
			{
				address: "vP6XSUyjmgWCB2B9tD5Rqun56WJqDdExWnfwZVEqzhQb", // ayin
				price: Number(resp.ethereum.usd),
				liquidity: null, // used to determine weight of price source
				source: "coingecko", // coingecko | ayin
				sourceKey: "ethereum", // pairAddress, coingecko id, etc
				timestamp: new Date(),
			},
			{
				address: "zSRgc7goAYUgYsEBYdAzogyyeKv3ne3uvWb3VDtxnaEK", // ayin
				price: Number(resp.tether.usd),
				liquidity: null, // used to determine weight of price source
				source: "coingecko", // coingecko | ayin
				sourceKey: "tether", // pairAddress, coingecko id, etc
				timestamp: new Date(),
			},
		]);
	});
}
