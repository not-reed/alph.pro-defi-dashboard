import type { Transaction } from "kysely";
import { db } from "../db";
import type { UserId } from "../schemas/public/User";
import type PublicSchema from "../schemas/public/PublicSchema";

export async function deleteWalletForUser(userId: UserId, address: string) {
  return await db
    .deleteFrom("UserWallet")
    .where("userId", "=", userId)
    .where("address", "=", address)
    .execute();
}

export async function setTipBotWallet(
  userId: UserId,
  address: string,
  trx: Transaction<PublicSchema>
) {
  await trx
    .updateTable("UserWallet")
    .where("userId", "=", userId)
    .where("verified", "=", true)
    .where("address", "<>", address)
    .set({ isTipBot: false })
    .execute();

  await trx
    .updateTable("UserWallet")
    .where("userId", "=", userId)
    .where("verified", "=", true)
    .where("address", "=", address)
    .set({ isTipBot: true })
    .execute();
}
