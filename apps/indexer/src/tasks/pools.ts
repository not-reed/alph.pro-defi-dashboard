import cron from "node-cron";
import { toString as parseCron } from "cronstrue";
import { addressFromTokenId } from "@alephium/web3";
import { AYIN_FACTORY, EVERY_15_MINUTES } from "../core/constants";
import TokenPairAbi from "../abi/ayin/TokenPair.ral.json";
import type { Artifact } from "../services/common/types/artifact";
import type { ContractAddress } from "../services/common/types/brands";
import sdk from "../services/sdk";
import { db } from "../database/db";
import { config } from "../config";
import { logger } from "../services/logger";

export async function startPoolsTask() {
	if (config.INDEXING_DISABLED) {
		logger.info("Pools Task Disabled: Skipping");
		return;
	}

	const schedule = EVERY_15_MINUTES;

	logger.info(`Starting Pools Task: ${parseCron(schedule)}`);

	// run on start and cache prices every 30 seconds
	cron.schedule(schedule, async () => {
		await ayinPoolReserves();
	});
}
export async function ayinPoolReserves() {
	const pools = await sdk.fetchSubContracts(AYIN_FACTORY, true);

	for (const pool of pools) {
		const state = await sdk.fetchState(pool, TokenPairAbi as Artifact);

		const fields = state.fields.reduce(
			(acc, field) => {
				acc[field.name] = field.value;
				return acc;
			},
			{} as Record<string, string | bigint | boolean>,
		);

		const newPool = {
			factory: AYIN_FACTORY,
			pair: pool,
			token0: addressFromTokenId(fields.token0Id as string) as ContractAddress,
			token1: addressFromTokenId(fields.token1Id as string) as ContractAddress,
		};

		const newReserve = {
			pairAddress: pool,
			amount0: BigInt(fields.reserve0),
			amount1: BigInt(fields.reserve1),
			totalSupply: BigInt(fields.totalSupply),
		};

		await db.transaction().execute(async (trx) => {
			await trx
				.insertInto("Pool")
				.values(newPool)
				.onConflict((col) => col.doNothing())
				.execute();

			await trx
				.insertInto("AyinReserve")
				.values(newReserve)
				.onConflict((col) =>
					col.column("pairAddress").doUpdateSet((eb) => ({
						amount0: eb.ref("excluded.amount0"),
						amount1: eb.ref("excluded.amount1"),
						totalSupply: eb.ref("excluded.totalSupply"),
					})),
				)
				.execute();
		});
	}
}
