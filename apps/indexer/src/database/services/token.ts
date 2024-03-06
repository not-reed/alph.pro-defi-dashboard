import type { Transaction } from "kysely";
import type PublicSchema from "../schemas/public/PublicSchema";
import type { Token } from "../schemas/public/Token";
import { db } from "../db";

export async function loadAllTokens() {
	return await db.selectFrom("Token").selectAll().execute();
}

export async function findTokensByAddress(addresses: string[]) {
	return await db
		.selectFrom("Token")
		.selectAll()
		.where("address", "in", addresses)
		.execute();
}

export async function updateToken(
	token: Token,
	trx: Transaction<PublicSchema>,
) {
	return await trx
		.updateTable("Token")
		.set(token)
		.where("id", "=", token.id)
		.execute();
}

export async function findTokenOrNftAddresses(tokenAddresses: string[]) {
	return await db
		.selectFrom("Token")
		.union(
			// filter out found nfts also
			db
				.selectFrom("Nft")
				.select("address")
				.where("address", "in", tokenAddresses),
		)
		.select(["address"])
		.where("address", "in", tokenAddresses)
		.execute();
}
