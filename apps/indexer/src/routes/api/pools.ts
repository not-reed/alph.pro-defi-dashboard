import { type Env, Hono, type Schema } from "hono";
import { db } from "../../database/db";
import {
	addressFromContractId,
	binToHex,
	contractIdFromAddress,
} from "@alephium/web3";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

const app = new Hono<Env, Schema, "/api/pools">();

app.get("/", async (c) => {
	const tokens = await db
		.selectFrom("Pool")
		.select(["Pool.factory"])
		// .select(["Pool.factory", "Pool.pair as pairAddress"]) // TODO: why/how did token indexer miss some pools
		.select((eb) => [
			jsonObjectFrom(
				eb
					.selectFrom("Token")
					.select(["address", "name", "symbol", "decimals", "totalSupply"])
					.whereRef("Token.address", "=", "Pool.pair"),
			).as("pair"),
			jsonObjectFrom(
				eb
					.selectFrom("Token")
					.select(["address", "name", "symbol", "decimals", "totalSupply"])
					.whereRef("Token.address", "=", "Pool.token0"),
			).as("token0"),
			jsonObjectFrom(
				eb
					.selectFrom("Token")
					.select(["address", "name", "symbol", "decimals", "totalSupply"])
					.whereRef("Token.address", "=", "Pool.token1"),
			).as("token1"),
		])
		.leftJoin("AyinReserve", (join) =>
			join.onRef("AyinReserve.pairAddress", "=", "Pool.pair"),
		)
		.select(["AyinReserve.amount0", "AyinReserve.amount1"])
		.where((qb) => {
			// return qb.not(
			return qb.exists(
				qb
					.selectFrom("Token")
					.select("Token.id")
					.whereRef("Token.address", "=", "Pool.pair"),
				// ),
			);
		})
		.execute();

	return c.json({
		pools: tokens.map((t) => {
			const pair = t.pair
				? {
						...t.pair,
						id: binToHex(contractIdFromAddress(t.pair.address)),
				  }
				: null;

			const token0 = t.token0
				? {
						...t.token0,
						id: binToHex(contractIdFromAddress(t.token0.address)),
				  }
				: null;

			const token1 = t.token1
				? {
						...t.token1,
						id: binToHex(contractIdFromAddress(t.token1.address)),
				  }
				: null;
			return {
				...t,
				id: binToHex(contractIdFromAddress(t.factory)),
				pair,
				token0,
				token1,
			};
		}),
	});
});

export default app;
