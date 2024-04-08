import { Hono, type Schema } from "hono";

import { verifyAuth, type AuthUser, type AuthConfig } from "@hono/auth-js";
import {
	generateChallengeMessage,
	validateAddressKey,
	verifySignature,
} from "../../utils/crypto";
import { HTTPException } from "hono/http-exception";
import {
	fetchUserNonce,
	refreshUserNonce,
} from "../../database/services/nonce";
import type { UserId } from "../../database/schemas/public/User";
import { db } from "../../database/db";

const app = new Hono<
	{ Variables: { authUser?: AuthUser; authConfig: AuthConfig } },
	Schema,
	"/api/web3"
>();

app.use("get-challenge", verifyAuth());
app.post("get-challenge", async (c) => {
	const { address, publicKey } = await c.req.json();
	const auth = c.get("authUser");
	if (!auth?.user?.id) {
		throw new HTTPException(403, { message: "Unable to validate user" });
	}
	const valid = validateAddressKey(address, publicKey);
	if (!valid) {
		throw new HTTPException(403, { message: "Unable to validate wallet" });
	}

	const nonce = await refreshUserNonce(auth.user.id as UserId);
	if (!nonce) {
		throw new HTTPException(403, { message: "Unable to refresh nonce" });
	}

	const message = generateChallengeMessage(
		"Alph.Pro",
		address,
		new URL(c.req.url).origin,
		nonce.version,
		nonce.nonce,
		nonce.createdAt.toISOString(),
	);

	return c.json({
		message,
	});
});

app.use("verify", verifyAuth());
app.post("verify", async (c) => {
	const auth = c.get("authUser");
	if (!auth?.user?.id) {
		throw new HTTPException(403, { message: "Unable to validate user" });
	}

	// verify
	const { signature, address, publicKey } = await c.req.json();

	const validPubKey = validateAddressKey(address, publicKey);
	if (!validPubKey) {
		throw new HTTPException(403, { message: "Unable to validate wallet" });
	}

	const nonce = await fetchUserNonce(auth.user.id as UserId);
	if (!nonce) {
		throw new HTTPException(403, { message: "Unable to find nonce" });
	}

	const message = generateChallengeMessage(
		"Alph.Pro",
		address,
		new URL(c.req.url).origin,
		nonce.version,
		nonce.nonce,
		nonce.createdAt.toISOString(),
	);

	const valid = await verifySignature(message, signature, publicKey);
	if (!valid) {
		throw new HTTPException(403, { message: "Invalid Signature" });
	}

	const wallets = await db
		.selectFrom("UserWallet")
		.selectAll()
		.where("userId", "=", auth.user?.id as UserId)
		.where("verified", "=", true)
		.execute();

	await db
		.insertInto("UserWallet")
		.values({
			userId: auth.user?.id as UserId,
			address: address,
			verified: true,
			isTipBot: wallets.length === 0, // only the first is set as tipbot by default
		})
		.onConflict((col) =>
			col
				.columns(["userId", "address"])
				.doUpdateSet({ verified: true, isTipBot: wallets.length === 0 }),
		)
		.execute();

	return c.json({ success: true });
});

export default app;
