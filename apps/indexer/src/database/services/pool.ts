import { db } from "../db";

export async function loadAllPools() {
	return await db
		.selectFrom("Pool")
		.leftJoin("AyinReserve", (join) =>
			join.onRef("AyinReserve.pairAddress", "=", "Pool.pair"),
		)
		.select(["pair", "token0", "token1", "amount0", "amount1", "totalSupply"])
		.execute();
}
