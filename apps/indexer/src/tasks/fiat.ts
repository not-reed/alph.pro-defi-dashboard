import cron from "node-cron";
import { toString as parseCron } from "cronstrue";
import { config } from "../config";
import { logger } from "../services/logger";
import { EVERY_30_MINUTES } from "../core/constants";
import type { NewFiatExchange } from "../database/schemas/public/FiatExchange";
import { db } from "../database/db";

interface Result {
	data: {
		date: `${number}-${number}-${number}`;
		from: "USD";
		rates: {
			AUD: number;
			BGN: number;
			BRL: number;
			CAD: number;
			CHF: number;
			CNY: number;
			CZK: number;
			DKK: number;
			EUR: number;
			GBP: number;
			HKD: number;
			HUF: number;
			IDR: number;
			ILS: number;
			INR: number;
			ISK: number;
			JPY: number;
			KRW: number;
			MXN: number;
			MYR: number;
			NOK: number;
			NZD: number;
			PHP: number;
			PLN: number;
			RON: number;
			SEK: number;
			SGD: number;
			THB: number;
			TRY: number;
			USD: number;
			ZAR: number;
		};
	};
}

export async function startFiatTask() {
	if (config.INDEXING_DISABLED) {
		logger.info("Plugin Task Disabled: Skipping");
		return;
	}

	const schedule = EVERY_30_MINUTES;

	logger.info(`Starting Fiat Task: ${parseCron(schedule)}`);

	// run on start and cache prices every 30 seconds
	cron.schedule(schedule, async () => {
		await updateFiatRates();
	});
}

export async function updateFiatRates() {
	// thanks d3lta19
	const rates: Result = await fetch(
		"https://free.ratesdb.com/v1/rates?from=USD",
	).then((a) => a.json());

	const newRates: NewFiatExchange[] = Object.entries(rates.data.rates).map(
		([code, rate]) => ({
			code,
			rate: BigInt(Math.floor(rate * 1e4)) * 10n ** 14n,
		}),
	);

	await db.transaction().execute(async (trx) => {
		for (const rate of newRates) {
			await trx
				.insertInto("FiatExchange")
				.values(rate)
				.onConflict((col) =>
					col.column("code").doUpdateSet((eb) => ({
						rate: eb.ref("excluded.rate"),
					})),
				)
				.execute();
		}
	});
}
