import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { Env, Schema } from "hono";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";
import { db } from "../../../database/db";

import { BalanceSchema } from "../../schemas/balance";

const app = new OpenAPIHono<Env, Schema, "/api/v2/balances">();

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
	const addresses = address.split(",");
	const balances = await db
		.selectNoFrom((eb) => [
			// Token Balances
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
					.where("userAddress", "in", addresses)
					.where("balance", ">", 0n),
			).as("tokens"),

			// NFTS
			jsonArrayFrom(
				eb
					.selectFrom("Balance")
					.leftJoinLateral(
						(eeb) =>
							eeb
								.selectFrom("Nft")
								.select((eeeb) => [
									"Nft.address",
									"Nft.description",
									"Nft.image",
									"Nft.name",
									"Nft.nftIndex",
									"Nft.collectionAddress",
									// jsonArrayFrom(
									// 	eeeb
									// 		.selectFrom("NftAttribute")
									// 		.select(["NftAttribute.key", "NftAttribute.value"])
									// 		.distinct()
									// 		.whereRef("NftAttribute.nftId", "=", "Nft.id"),
									// ).as("attributes"),
									// jsonObjectFrom(
									// 	eeeb
									// 		.selectFrom("NftCollection")
									// 		.select([
									// 			"address",
									// 			"uri",
									// 			"image",
									// 			"name",
									// 			"description",
									// 			"listed",
									// 			(eeeeb) =>
									// 				jsonObjectFrom(
									// 					eeeeb
									// 						.selectFrom("Social")
									// 						.select([
									// 							"name",
									// 							"github",
									// 							"twitter",
									// 							"website",
									// 							"telegram",
									// 							"medium",
									// 							"discord",
									// 						])
									// 						.whereRef(
									// 							"NftCollection.socialId",
									// 							"=",
									// 							"Social.id",
									// 						),
									// 				).as("social"),

									// 			(eeeeb) =>
									// 				eeeeb
									// 					.selectFrom("DeadRareListing")
									// 					.whereRef(
									// 						"DeadRareListing.collectionAddress",
									// 						"=",
									// 						"NftCollection.address",
									// 					)
									// 					.select([(eb) => eb.fn.min("price").as("floor")])
									// 					.where("soldAt", "is", null)
									// 					.where("unlistedAt", "is", null)
									// 					// .orderBy("price", "asc")
									// 					.limit(1)
									// 					.as("floor"),
									// 		])
									// 		.whereRef(
									// 			"NftCollection.address",
									// 			"=",
									// 			"Nft.collectionAddress",
									// 		),
									// ).as("collection"),
								])
								.whereRef("Nft.address", "=", "Balance.tokenAddress")
								.as("nft"),
						(join) => join.onTrue(),
					)
					.select((eeb) => [
						"userAddress",
						"balance",
						"nft",
						// jsonObjectFrom(
						// 	eeb
						// 		.selectFrom("Nft")
						// 		.select((eeeb) => [
						// 			"Nft.address",
						// 			"Nft.description",
						// 			"Nft.image",
						// 			"Nft.name",
						// 			"Nft.nftIndex",
						// 			jsonArrayFrom(
						// 				eeeb
						// 					.selectFrom("NftAttribute")
						// 					.select((eeeeb) => [
						// 						"NftAttribute.key",
						// 						"NftAttribute.value",
						// 					])
						// 					.whereRef("NftAttribute.nftId", "=", "Nft.id"),
						// 			).as("attributes"),

						// 			jsonObjectFrom(
						// 				eeeb
						// 					.selectFrom("NftCollection")
						// 					.select([
						// 						"address",
						// 						"uri",
						// 						"image",
						// 						"name",
						// 						"description",
						// 						"listed",
						// 						(eeeeb) =>
						// 							jsonObjectFrom(
						// 								eeeeb
						// 									.selectFrom("Social")
						// 									.select([
						// 										"name",
						// 										"github",
						// 										"twitter",
						// 										"website",
						// 										"telegram",
						// 										"medium",
						// 										"discord",
						// 									])
						// 									.whereRef(
						// 										"NftCollection.socialId",
						// 										"=",
						// 										"Social.id",
						// 									),
						// 							).as("social"),
						// 						eeeb
						// 							.selectFrom("DeadRareListing")
						// 							.whereRef(
						// 								"DeadRareListing.collectionAddress",
						// 								"=",
						// 								"Nft.collectionAddress",
						// 							)
						// 							.select("price")
						// 							.where("soldAt", "is", null)
						// 							.where("unlistedAt", "is", null)
						// 							.orderBy("price", "asc")
						// 							.limit(1)
						// 							.as("floor"),
						// 					])
						// 					.whereRef(
						// 						"NftCollection.address",
						// 						"=",
						// 						"Nft.collectionAddress",
						// 					),
						// 			).as("collection"),
						// 		])
						// 		.whereRef("Nft.address", "=", "Balance.tokenAddress"),
						// ).as("nft"),
					])
					.where((eb) =>
						eb.exists((eeb) =>
							eeb
								.selectFrom("Nft")
								.selectAll()
								.whereRef("Nft.address", "=", "Balance.tokenAddress"),
						),
					)
					.where("userAddress", "in", addresses)
					.where("balance", ">", 0n),
			).as("nfts"),

			// Liquidity Pools
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
					.where("userAddress", "in", addresses)
					.whereRef("userAddress", "!=", "tokenAddress")
					.where("balance", ">", 0n),
			).as("pools"),

			// Staking Positions
			jsonArrayFrom(
				eb
					.selectFrom("StakingEvent")
					.select([
						(eeb) => eeb.fn.sum("amount").as("balance"),
						"StakingEvent.userAddress",
						(eeb) =>
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
										(eeb) =>
											jsonObjectFrom(
												eeb
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
									.whereRef("Token.address", "=", "StakingEvent.tokenAddress"),
							).as("single"),
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
					.where("userAddress", "in", addresses)
					.where(
						"StakingEvent.contractAddress",
						"<>",
						"yzoCumd4Fpi959NSis9Nnyr28UkgyRYqrKBgYNAuYj3m",
					) // temporarily disable alph-pad staking
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

	const collections =
		balances?.nfts.length === 0
			? new Map()
			: await db
					.selectFrom("NftCollection")
					.select((eeeb) => [
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
									.whereRef("NftCollection.socialId", "=", "Social.id"),
							).as("social"),
						eeeb
							.selectFrom("DeadRareListing")
							.whereRef(
								"DeadRareListing.collectionAddress",
								"=",
								"NftCollection.address",
							)
							.select("price")
							.where("soldAt", "is", null)
							.where("unlistedAt", "is", null)
							.orderBy("price", "asc")
							.limit(1)
							.as("floor"),
					])
					.where(
						"address",
						"in",
						balances?.nfts.map((n) => n.nft.collectionAddress) ?? [],
					)
					.execute()
					.then((collections) =>
						collections.reduce((acc, collection) => {
							return acc.set(collection.address, collection);
						}, new Map()),
					);

	const results = {
		tokens: balances?.tokens.map((t) => ({ ...t, balance: BigInt(t.balance) })),
		nfts: balances?.nfts.map((n) => {
			return {
				...n,
				balance: BigInt(n.balance),
				nft: {
					...n.nft,
					attributes: [], // TODO: remove this to restore attributes
					collection: collections?.get(n.nft.collectionAddress) ?? null,
				},
			};
		}),
		pools: balances?.pools
			.map(
				(p) =>
					p?.pool && {
						...p,
						balance: BigInt(p.balance),
						pool: {
							...p.pool,
							amount0: BigInt(p.pool.amount0),
							amount1: BigInt(p.pool.amount1),
							totalSupply: BigInt(p.pool.totalSupply),
						},
					},
			)
			.filter(Boolean),
		farms: balances?.farms
			.map((s) => {
				return {
					...s,
					balance: BigInt(s.balance),
					single: s?.pool ? null : s?.single,
					pool: s?.pool && {
						...s.pool,
						amount0: BigInt(s.pool.amount0),
						amount1: BigInt(s.pool.amount1),
						totalSupply: BigInt(s.pool.totalSupply),
					},
				};
			})
			.filter((s) => s.pool || s.single),
	};

	return c.json(results);
});

export default app;
