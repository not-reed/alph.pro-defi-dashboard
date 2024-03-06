import { type Env, Hono, type Schema } from "hono";

import {
	authHandler,
	verifyAuth,
	type AuthUser,
	type AuthConfig,
} from "@hono/auth-js";
import { db } from "../../database/db";
import type { UserId } from "../../database/schemas/public/User";
import {
	deleteWalletForUser,
	setTipBotWallet,
} from "../../database/services/userWallet";

const app = new Hono<
	{ Variables: { authUser: AuthUser; authConfig: AuthConfig } },
	Schema,
	"/api/wallets"
>();

app.use("*", verifyAuth());

app.get("", async (c) => {
	const auth = c.get("authUser");

	if (auth.user?.id) {
		return c.json({
			wallets: await db
				.selectFrom("UserWallet")
				.select(["address", "verified", "isTipBot"])
				.where("userId", "=", auth.user?.id as UserId)
				.orderBy("UserWallet.verified", "desc")
				.orderBy("UserWallet.address", "desc")
				.execute(),
		});
	}
	return c.json({ success: false });
});

app.post("", async (c) => {
	const auth = c.get("authUser");
	const body = await c.req.json();

	if (auth.user?.id) {
		await db
			.insertInto("UserWallet")
			.values({
				userId: auth.user?.id as UserId,
				address: body.address,
				verified: false,
			})
			.execute();
	}
	return c.json({ success: true });
});

app.delete("", async (c) => {
	const auth = c.get("authUser");
	const body = await c.req.json();

	if (auth.user?.id) {
		await deleteWalletForUser(auth.user?.id as UserId, body.address);
	}
	return c.json({ success: true });
});

app.post("tip-bot", async (c) => {
	const auth = c.get("authUser");
	const { address } = await c.req.json();

	await db.transaction().execute(async (trx) => {
		await setTipBotWallet(auth.user?.id as UserId, address, trx);
	});

	return c.json({ success: true });
});

export default app;
