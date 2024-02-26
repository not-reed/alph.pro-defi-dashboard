import { type Env, type Schema } from "hono";

import { db } from "../../database/db";
import { binToHex, contractIdFromAddress } from "@alephium/web3";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const app = new OpenAPIHono<Env, Schema, "/api/nfts">();

app.doc("/docs.json", {
	info: {
		title: "Alph.Pro Indexer API",
		version: "v2",
	},
	openapi: "3.1.0",
});

const nftRoute = createRoute({
	method: "get",
	tags: ["NFTs"],
	path: "",
	request: {},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						nfts: z.array(
							z.object({
								id: z.string(),
								address: z.string(),
								name: z.string(),
								description: z.string(),
								image: z.string(),
							}),
						),
					}),
				},
			},
			description: "Retrieve the user",
		},
	},
});

app.openapi(nftRoute, async (c) => {
	const nfts = await db.selectFrom("NftCollection").selectAll().execute();

	return c.json({
		nfts: nfts.map((a) => {
			return {
				id: binToHex(contractIdFromAddress(a.address)),
				address: a.address,
				image: a.image,
				name: a.name,
				description: a.description,
			};
		}),
	});
});

const nftSingleByIdxRoute = createRoute({
	method: "get",
	tags: ["NFTs"],
	path: "/by-index/{address}/{idx}",
	request: {
		params: z.object({
			address: z.string().openapi({
				param: { name: "address", in: "path" },
				example: "22W9Xqz3BZE9fsCEtgqsk6CTRHktF2tFYb5wc1RWWCa8X",
			}),
			idx: z.coerce.number().openapi({
				param: { name: "idx", in: "path" },
				example: 1,
			}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						owner: z.string(),
						nft: z
							.object({
								address: z.string(),
								collectionAddress: z.string(),
								description: z.string(),
								id: z.string(),
								image: z.string(),
								name: z.string(),
								nftIndex: z.string(),
								uri: z.string(),
							})
							.openapi("Nft"),
					}),
				},
			},
			description: "Retrieve the user",
		},
	},
});

app.openapi(nftSingleByIdxRoute, async (c) => {
	const { address, idx } = c.req.param();

	const nft = await db
		.selectFrom("Nft")
		.selectAll()
		.where("collectionAddress", "=", address)
		.where("nftIndex", "=", BigInt(idx))
		.executeTakeFirstOrThrow();

	const owner = await db
		.selectFrom("Balance")
		.selectAll()
		.where("tokenAddress", "=", nft.address)
		.where("balance", "=", 1n)
		.executeTakeFirstOrThrow();
	return c.json({
		owner: owner.userAddress,
		nft: {
			address: nft.address || "",
			collectionAddress: nft.collectionAddress,
			description: nft.description,
			id: binToHex(contractIdFromAddress(nft.address as string)),
			image: nft.image,
			name: nft.name,
			nftIndex: nft.nftIndex.toString(),
			uri: nft.uri,
		},
	});
});

const nftSingleRoute = createRoute({
	method: "get",
	tags: ["NFTs"],
	path: "/{address}",
	request: {
		params: z.object({
			address: z.string().openapi({
				param: { name: "address", in: "path" },
				example: "22W9Xqz3BZE9fsCEtgqsk6CTRHktF2tFYb5wc1RWWCa8X",
			}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						nft: z
							.object({
								id: z.string(),
								address: z.string(),
								name: z.string(),
								description: z.string(),
								image: z.string(),
							})
							.openapi("Nft"),
					}),
				},
			},
			description: "Retrieve the user",
		},
	},
});

app.openapi(nftSingleRoute, async (c) => {
	const { address } = c.req.valid("param");

	const nft = await db
		.selectFrom("NftCollection")
		.selectAll()
		.where("address", "=", address)
		.executeTakeFirstOrThrow();
	return c.json({
		nft: {
			id: binToHex(contractIdFromAddress(nft.address)),
			address: nft.address,
			image: nft.image,
			name: nft.name,
			description: nft.description,
		},
	});
});

export default app;
