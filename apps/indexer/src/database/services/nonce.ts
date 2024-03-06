import { sql } from "kysely";
import { db } from "../db";
import type { UserId } from "../schemas/public/User";
import { generateNonce } from "../../utils/crypto";
import type { NewNonce } from "../schemas/public/Nonce";

export const insertNonce = async (newNonce: NewNonce) => {
	return await db
		.insertInto("Nonce")
		.values(newNonce)
		.returningAll()
		.executeTakeFirst();
};

export async function fetchUserNonce(userId: UserId) {
	return await db
		.selectFrom("Nonce")
		.selectAll()
		.where("userId", "=", userId)
		.where("deletedAt", "is", null)
		.orderBy("createdAt", "desc")
		.executeTakeFirst();
}

export async function burnUserNonces(userId: UserId) {
	return await db
		.updateTable("Nonce")
		.set({ deletedAt: sql`CURRENT_TIMESTAMP` })
		.where("userId", "=", userId)
		.execute();
}

export async function refreshUserNonce(userId: UserId) {
	// delete  all active nonces for user
	await burnUserNonces(userId);

	const nonce = generateNonce();

	return await insertNonce({
		// all nonces are currently version 1
		version: 1,
		nonce,
		userId,
	});
}
