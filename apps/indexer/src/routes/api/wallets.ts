import { type Env, Hono, type Schema } from "hono";

import {
	authHandler,
	verifyAuth,
	type AuthUser,
	type AuthConfig,
} from "@hono/auth-js";
import { db } from "../../database/db";
import type { UserId } from "../../database/schemas/public/User";

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
				.select(["address", "verified"])
				.where("userId", "=", auth.user?.id as UserId)
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
	console.log({ auth, body });
	if (auth.user?.id) {
		await db
			.deleteFrom("UserWallet")
			.where("userId", "=", auth.user?.id as UserId)
			.where("address", "=", body.address)
			.execute();
	}
	return c.json({ success: true });
});

export default app;
