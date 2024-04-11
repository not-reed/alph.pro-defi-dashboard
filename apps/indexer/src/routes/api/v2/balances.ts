import type { Env, Schema } from "hono";
import { db } from "../../../database/db";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

import { BalanceSchema } from "../../schemas/balance";
import { binToHex, contractIdFromAddress } from "@alephium/web3";

const app = new OpenAPIHono<Env, Schema, "/api/balances">();

app.doc("/docs.json", {
	info: {
		title: "Balances",
		version: "v2",
	},
	openapi: "3.1.0",
});

const v2Route = createRoute({
	method: "get",
	tags: ["Balances"],
	path: "",
	request: {
		query: z.object({
			address: z
				.string()
				.min(10)
				.openapi({
					param: {
						name: "address",
						in: "query",
					},
					example: "1CHYuhea7uaupotv2KkSwNLaJWYeNouDp4QffhkhTxKpr",
				}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						balances: z.array(BalanceSchema),
					}),
				},
			},
			description: "Fetch user balances",
		},
	},
});

app.openapi(v2Route, async (c) => {
	const { address } = c.req.valid("query");
	const balances = await db
		.selectNoFrom((eb) => [
			jsonArrayFrom(
				eb
					.selectFrom("Balance")
					.select((eeb) => [
						"userAddress",
						"balance",
						jsonObjectFrom(
							eeb
								.selectFrom("Token")
								.select([
									"address",
									"name",
									"symbol",
									"decimals",
									"totalSupply",
									"listed",
									"description",
									"logo",
									(eeeb) =>
										jsonObjectFrom(
											eeeb
												.selectFrom("Social")
												.select([
													"name",
													"github",
													"twitter",
													"website",
													"telegram",
													"medium",
													"discord",
												])
												.whereRef("Token.socialId", "=", "Social.id"),
										).as("social"),
								])
								.whereRef("Token.address", "=", "Balance.tokenAddress"),
						).as("token"),
					])
					.where((eb) =>
						eb.exists(
							eb
								.selectFrom("Token")
								.selectAll()
								.whereRef("Token.address", "=", "Balance.tokenAddress"),
						),
					)
					.where((eb) =>
						eb.not(
							eb.exists(
								eb
									.selectFrom("Pool")
									.selectAll()
									.whereRef("Pool.pair", "=", "Balance.tokenAddress"),
							),
						),
					)
					.where("userAddress", "=", address),
			).as("tokens"),
			jsonArrayFrom(
				eb
					.selectFrom("Balance")
					.select((eeb) => [
						"userAddress",
						"balance",
						jsonObjectFrom(
							eeb
								.selectFrom("Nft")
								.select((eeeb) => [
									"Nft.address",
									"Nft.description",
									"Nft.image",
									"Nft.name",
									"Nft.nftIndex",
									jsonArrayFrom(
										eeeb
											.selectFrom("NftAttribute")
											.select((eeeeb) => [
												"NftAttribute.key",
												"NftAttribute.value",
											])
											.whereRef("NftAttribute.nftId", "=", "Nft.id"),
									).as("attributes"),

									jsonObjectFrom(
										eeeb
											.selectFrom("NftCollection")
											.select([
												"address",
												"uri",
												"image",
												"name",
												"description",
												"listed",
												(eeeeb) =>
													jsonObjectFrom(
														eeeeb
															.selectFrom("Social")
															.select([
																"name",
																"github",
																"twitter",
																"website",
																"telegram",
																"medium",
																"discord",
															])
															.whereRef(
																"NftCollection.socialId",
																"=",
																"Social.id",
															),
													).as("social"),
												eeeb
													.selectFrom("DeadRareListing")
													.whereRef(
														"DeadRareListing.collectionAddress",
														"=",
														"Nft.collectionAddress",
													)
													.select("price")
													.where("soldAt", "is", null)
													.where("unlistedAt", "is", null)
													.orderBy("price", "asc")
													.limit(1)
													.as("floor"),
											])
											.whereRef(
												"NftCollection.address",
												"=",
												"Nft.collectionAddress",
											),
									).as("collection"),
								])
								.whereRef("Nft.address", "=", "Balance.tokenAddress"),
						).as("nft"),
					])
					.where((eb) =>
						eb.exists((eeb) =>
							eeb
								.selectFrom("Nft")
								.selectAll()
								.whereRef("Nft.address", "=", "Balance.tokenAddress"),
						),
					)
					.where("userAddress", "=", address),
			).as("nfts"),

			jsonArrayFrom(
				eb
					.selectFrom("Balance")
					.select((eeb) => [
						"userAddress",
						"balance",
						jsonObjectFrom(
							eeb
								.selectFrom("Pool")
								.innerJoin(
									"AyinReserve",
									"Pool.pair",
									"AyinReserve.pairAddress",
								)
								.select((eeeb) => [
									"factory",
									"amount0",
									"amount1",
									"totalSupply",
									jsonObjectFrom(
										eeeb
											.selectFrom("Token")
											.select([
												"address",
												"name",
												"symbol",
												"decimals",
												"totalSupply",
												"listed",
												"description",
												"logo",
												(eeeb) =>
													jsonObjectFrom(
														eeeb
															.selectFrom("Social")
															.select([
																"name",
																"github",
																"twitter",
																"website",
																"telegram",
																"medium",
																"discord",
															])
															.whereRef("Token.socialId", "=", "Social.id"),
													).as("social"),
											])
											.whereRef("Token.address", "=", "Pool.pair"),
									).as("pair"),
									jsonObjectFrom(
										eeeb
											.selectFrom("Token")
											.select([
												"address",
												"name",
												"symbol",
												"decimals",
												"totalSupply",
												"listed",
												"description",
												"logo",
												(eeeb) =>
													jsonObjectFrom(
														eeeb
															.selectFrom("Social")
															.select([
																"name",
																"github",
																"twitter",
																"website",
																"telegram",
																"medium",
																"discord",
															])
															.whereRef("Token.socialId", "=", "Social.id"),
													).as("social"),
											])
											.whereRef("Token.address", "=", "Pool.token0"),
									).as("token0"),
									jsonObjectFrom(
										eeeb
											.selectFrom("Token")
											.select([
												"address",
												"name",
												"symbol",
												"decimals",
												"totalSupply",
												"listed",
												"description",
												"logo",
												(eeeb) =>
													jsonObjectFrom(
														eeeb
															.selectFrom("Social")
															.select([
																"name",
																"github",
																"twitter",
																"website",
																"telegram",
																"medium",
																"discord",
															])
															.whereRef("Token.socialId", "=", "Social.id"),
													).as("social"),
											])
											.whereRef("Token.address", "=", "Pool.token1"),
									).as("token1"),
								])
								.whereRef("Pool.pair", "=", "Balance.tokenAddress"),
						).as("pool"),
					])
					.where((eb) =>
						eb.exists((eeb) =>
							eeb
								.selectFrom("Pool")
								.selectAll()
								.whereRef("Pool.pair", "=", "Balance.tokenAddress"),
						),
					)
					.where("userAddress", "=", address)
					.where("balance", ">", 0n),
			).as("pools"),

			jsonArrayFrom(
				eb
					.selectFrom("StakingEvent")
					.select([
						(eeb) => eeb.fn.sum("amount").as("balance"),
						"StakingEvent.userAddress",
						(eeb) =>
							jsonObjectFrom(
								eeb
									.selectFrom("Pool")
									.innerJoin(
										"AyinReserve",
										"Pool.pair",
										"AyinReserve.pairAddress",
									)
									.select((eeeb) => [
										"factory",
										"amount0",
										"amount1",
										"totalSupply",
										jsonObjectFrom(
											eeeb
												.selectFrom("Token")
												.select([
													"address",
													"name",
													"symbol",
													"decimals",
													"totalSupply",
													"listed",
													"description",
													"logo",
													(eeeb) =>
														jsonObjectFrom(
															eeeb
																.selectFrom("Social")
																.select([
																	"name",
																	"github",
																	"twitter",
																	"website",
																	"telegram",
																	"medium",
																	"discord",
																])
																.whereRef("Token.socialId", "=", "Social.id"),
														).as("social"),
												])
												.whereRef("Token.address", "=", "Pool.pair"),
										).as("pair"),
										jsonObjectFrom(
											eeeb
												.selectFrom("Token")
												.select([
													"address",
													"name",
													"symbol",
													"decimals",
													"totalSupply",
													"listed",
													"description",
													"logo",
													(eeeb) =>
														jsonObjectFrom(
															eeeb
																.selectFrom("Social")
																.select([
																	"name",
																	"github",
																	"twitter",
																	"website",
																	"telegram",
																	"medium",
																	"discord",
																])
																.whereRef("Token.socialId", "=", "Social.id"),
														).as("social"),
												])
												.whereRef("Token.address", "=", "Pool.token0"),
										).as("token0"),
										jsonObjectFrom(
											eeeb
												.selectFrom("Token")
												.select([
													"address",
													"name",
													"symbol",
													"decimals",
													"totalSupply",
													"listed",
													"description",
													"logo",
													(eeeb) =>
														jsonObjectFrom(
															eeeb
																.selectFrom("Social")
																.select([
																	"name",
																	"github",
																	"twitter",
																	"website",
																	"telegram",
																	"medium",
																	"discord",
																])
																.whereRef("Token.socialId", "=", "Social.id"),
														).as("social"),
												])
												.whereRef("Token.address", "=", "Pool.token1"),
										).as("token1"),
									])
									.whereRef("Pool.pair", "=", "StakingEvent.tokenAddress"),
							).as("pool"),
					])
					.where("userAddress", "=", address)
					.where((eb) =>
						eb.or([
							eb("accountAddress", "is", null), // bread didn't track stake account at first?

							eb(
								"accountAddress",
								"!=",
								"26B8TfTHPKEdWuehaDrtjuPyGH57gPoDoXtm1T7L4uuJf", // remove pounder data
							),
						]),
					)
					.where("action", "in", ["deposit", "withdraw"])
					.groupBy("StakingEvent.userAddress")
					.groupBy("StakingEvent.tokenAddress")
					.groupBy("StakingEvent.accountAddress")
					.having((eeb) => eeb.fn.sum("amount"), ">", 0), // TODO: verify
			).as("farms"),
		])
		.executeTakeFirst();

	return c.json({
		tokens: balances?.tokens.map((t) => ({ ...t, balance: BigInt(t.balance) })),
		nfts: balances?.nfts.map((n) => ({
			...n,
			balance: BigInt(n.balance),
			nft: {
				...n.nft,
				attributes: [], // TODO: remove this to restore attributes
			},
		})),
		pools: balances?.pools.map((p) => ({
			...p,
			balance: BigInt(p.balance),
			pool: {
				...p.pool,
				amount0: BigInt(p.pool.amount0),
				amount1: BigInt(p.pool.amount1),
				totalSupply: BigInt(p.pool.totalSupply),
			},
		})),
		farms: balances?.farms.map((s) => ({
			...s,
			balance: BigInt(s.balance),
			pool: {
				...s.pool,
				amount0: BigInt(s.pool.amount0),
				amount1: BigInt(s.pool.amount1),
				totalSupply: BigInt(s.pool.totalSupply),
			},
		})),
	});
});

export default app;
