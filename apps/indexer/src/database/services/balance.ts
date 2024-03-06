import type { Transaction } from "kysely";
import type { NewBalance } from "../schemas/public/Balance";
import type PublicSchema from "../schemas/public/PublicSchema";

export async function deleteUserBalances(
	userAddress: string,
	trx: Transaction<PublicSchema>,
) {
	return await trx
		.deleteFrom("Balance")
		.where("userAddress", "=", userAddress)
		.execute();
}

export async function insertUserBalances(
	balances: NewBalance[],
	trx: Transaction<PublicSchema>,
) {
	return await trx.insertInto("Balance").values(balances).execute();
}

export async function updateNftBalances(
	balances: NewBalance[],
	trx: Transaction<PublicSchema>,
) {
	// delete previous owners (if any)
	await trx
		.deleteFrom("Balance")
		.where(
			"Balance.tokenAddress",
			"in",
			balances.map((b) => b.tokenAddress),
		)
		.execute();

	// insert new owner
	await trx.insertInto("Balance").values(balances).execute();
}
