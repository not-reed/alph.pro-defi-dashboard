import {
	EnableOptions,
	getDefaultAlephiumWallet,
} from "@alephium/get-extension-wallet";

import { ConnectResult, ConnectionOptions, Connector } from "./types";

import { CommonProvider, makeCommonAccount, makeCommonProvider } from "./utils";

async function connect(
	options: ConnectionOptions & EnableOptions,
): Promise<ConnectResult | undefined> {
	try {
		const windowAlephium = await getDefaultAlephiumWallet();
		if (!windowAlephium) {
			throw new Error("Alephium wallet not found");
		}
		const account = await windowAlephium.enable({
			addressGroup: options.addressGroup,
			networkId: options.networkId,
			// keyType: options.keyType,
			onDisconnected: options.onDisconnected,
		});

		if (account) {
			return {
				success: true,
				account: makeCommonAccount(account, windowAlephium.connectedNetworkId),
				provider: makeCommonProvider(windowAlephium),
			};
		}
	} catch (error) {
		console.error("Injected Wallet connect error:", error);
		options.onDisconnected();
	}
}

async function disconnect(provider: CommonProvider): Promise<void> {
	await provider?.disconnect();
}

async function autoConnect(
	options: ConnectionOptions & EnableOptions,
): Promise<ConnectResult | undefined> {
	try {
		const windowAlephium = await getDefaultAlephiumWallet();
		if (!windowAlephium) {
			throw new Error("Alephium wallet not found");
		}
		const account = await windowAlephium.enableIfConnected({
			addressGroup: options.addressGroup,
			networkId: options.networkId,
			// keyType: options.keyType,
			onDisconnected: options.onDisconnected,
		});

		if (account) {
			return {
				success: true,
				account: makeCommonAccount(account, windowAlephium.connectedNetworkId),
				provider: makeCommonProvider(windowAlephium),
			};
		}
	} catch (error) {
		console.error("Injected Wallet auto-connect error:", error);
		options.onDisconnected();
	}
}

export const connector = {
	connect,
	disconnect,
	autoConnect,
} satisfies Connector;
