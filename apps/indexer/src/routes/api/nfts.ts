import { type Env, Hono, type Schema } from "hono";

import { db } from "../../database/db";
import { binToHex, contractIdFromAddress } from "@alephium/web3";

const app = new Hono<Env, Schema, "/api/nfts">();

app.get("", async (c) => {
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

app.get("/:address", async (c) => {
	const { address } = c.req.param();
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
