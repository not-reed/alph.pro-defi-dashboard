import {
	addressFromPublicKey,
	verifySignedMessage as verifyAlephiumSignature,
} from "@alephium/web3";

import { randomBytes } from "node:crypto";

export function validateAddressKey(address: string, publicKey: string) {
	return address === addressFromPublicKey(publicKey);
}

export function verifySignature(
	message: string,
	signature: string,
	publicKey: string,
) {
	return verifyAlephiumSignature(message, "alephium", publicKey, signature);
}

export function generateChallengeMessage(
	serviceName: string,
	address: string,
	uri: string,
	version: number,
	nonce: string,
	createdAt: string,
) {
	if (version !== 1) {
		throw new Error("Invalid nonce version");
	}

	const message = `${serviceName} wants you to sign in with your Alephium account:
${address}

URI: ${uri}
Version: ${version}
Nonce: ${nonce}
Issued At: ${createdAt}`;

	return message;
}

export function generateNonce(bytes = 8) {
	return randomBytes(bytes).toString("hex");
}
