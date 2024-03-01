import { Hono, type Env, type Schema } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { db } from "../../database/db";
import { config } from "../../config";

const app = new Hono<Env, Schema, "/api/bot">();

app.use("*", bearerAuth({ token: config.BOT_AUTH_TOKEN }));

app.get("/primary-address", async (c) => {
	const { discordId } = c.req.query();

	const wallet = await db
		.selectFrom("UserWallet")
		.select(["address"])
		.where("isTipBot", "=", true)
		.where((eb) =>
			eb.exists(
				eb
					.selectFrom("Account")
					.select("id")
					.where("providerAccountId", "=", discordId)
					.whereRef("Account.userId", "=", "UserWallet.userId"),
			),
		)
		.executeTakeFirst();

	return c.json({ address: wallet?.address ?? null });
});

export default app;
