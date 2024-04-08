import type { Env, Schema } from "hono";
import { db } from "../../database/db";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

import { BalanceSchema } from "../schemas/balance";
import { binToHex, contractIdFromAddress } from "@alephium/web3";
import { fixBalances } from "../../cli/balances";

const app = new OpenAPIHono<Env, Schema, "/api/balances">();

app.doc("/docs.json", {
	info: {
		title: "Balances",
		version: "v1",
	},
	openapi: "3.1.0",
});

async function fetchUserBalances(addresses: string[]) {
	const balances = await db
		.selectFrom("Balance")
		.select(["userAddress", "balance"])
		.select((eb) => [
			jsonObjectFrom(
				eb
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
					])
					.whereRef("Token.address", "=", "Balance.tokenAddress"),
			).as("token"),
			jsonObjectFrom(
				eb
					.selectFrom("Nft")
					.select((eb) => [
						"Nft.address",
						"Nft.name",
						"Nft.image",
						"Nft.description",
						"Nft.uri",
						"Nft.nftIndex",
						eb
							.selectFrom("DeadRareListing")
							.whereRef("DeadRareListing.tokenAddress", "=", "Nft.address")
							.select("price")
							.where("soldAt", "is", null)
							.where("unlistedAt", "is", null)
							.orderBy("price", "asc")
							.limit(1)
							.as("listedPrice"),
						jsonObjectFrom(
							eb
								.selectFrom("NftCollection")
								.select([
									"NftCollection.address",
									"NftCollection.uri",
									"NftCollection.image",
									"NftCollection.name",
									"NftCollection.description",
									eb
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
								.whereRef("NftCollection.address", "=", "collectionAddress"),
						).as("collection"),
					])
					.whereRef("Nft.address", "=", "Balance.tokenAddress"),
			).as("nft"),
		])
		.where("userAddress", "in", addresses)
		.where("balance", ">", 0n)
		.where((eb) =>
			eb.or([
				eb
					.selectFrom("Token")
					.whereRef("Token.address", "=", "Balance.tokenAddress")
					.select("listed"),
				eb.exists(
					eb
						.selectFrom("Nft")
						.whereRef("Nft.address", "=", "Balance.tokenAddress")
						.select("id"),
				),
			]),
		)
		.execute();

	return balances.map((balance) => {
		return {
			...balance,
			token: balance.token?.address
				? {
						id: binToHex(contractIdFromAddress(balance.token.address)),
						...balance.token,
				  }
				: null,
			nft: balance.nft?.address
				? {
						id: binToHex(contractIdFromAddress(balance.nft.address)),
						...balance.nft,
						collection: {
							id: binToHex(
								contractIdFromAddress(balance.nft.collection?.address || ""),
							),
							...balance.nft.collection,
						},
				  }
				: null,
		};
	});
}

const route = createRoute({
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

app.openapi(route, async (c) => {
	const { address } = c.req.valid("query");
	const balances = await fetchUserBalances(address?.split(","));
	// const nfts = await fetchUserNfts(address?.split(","));
	return c.json({
		balances,
	});
});

app.post("fix", async (c) => {
	const wallet = await c.req.query("address");

	await fixBalances({
		user: wallet,
	});

	return c.json({ success: true });
});

export default app;
