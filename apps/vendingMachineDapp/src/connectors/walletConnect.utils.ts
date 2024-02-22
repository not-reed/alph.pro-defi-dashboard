import {
	ProviderEventArgument,
	ProviderOptions,
	WalletConnectProvider,
} from "@alephium/walletconnect-provider";
import { ConnectResult, ConnectionOptions } from "./types";

import { CommonProvider, makeCommonAccount, makeCommonProvider } from "./utils";

const WALLET_CONNECT_PROJECT_ID = "6e2562e43678dd68a9070a62b6d52207";

export interface ProviderCallbacks {
	onDisplayUri: (args: ProviderEventArgument<"displayUri">) => void;
	onAccountChanged?: (args: ProviderEventArgument<"accountChanged">) => void;
	onSessionPing?: (args: ProviderEventArgument<"session_ping">) => void;
	onSessionUpdate?: (args: ProviderEventArgument<"session_update">) => void;
	onSessionEvent?: (args: ProviderEventArgument<"session_event">) => void;
	onDisconnected: (args: ProviderEventArgument<"session_delete">) => void;
}

async function registerHooks(
	provider: WalletConnectProvider,
	options: ProviderOptions,
	callbacks: Partial<ProviderCallbacks>,
) {
	if (callbacks.onAccountChanged) {
		provider.on("accountChanged", callbacks.onAccountChanged);
	}
	if (callbacks.onSessionPing) {
		provider.on("session_ping", callbacks.onSessionPing);
	}
	if (callbacks.onSessionUpdate) {
		provider.on("session_update", callbacks.onSessionUpdate);
	}
	if (callbacks.onSessionEvent) {
		provider.on("session_event", callbacks.onSessionEvent);
	}

	if (callbacks.onDisplayUri) {
		provider.on("displayUri", callbacks.onDisplayUri);
	}

	provider.on("session_delete", options.onDisconnected);
}

export async function _wcConnect(
	options: ConnectionOptions & ProviderOptions,
	callbacks: Partial<ProviderCallbacks>,
): Promise<ConnectResult | undefined> {
	try {
		const provider = await WalletConnectProvider.init({
			addressGroup: options.addressGroup,
			networkId: options.networkId,
			onDisconnected: options.onDisconnected,
			projectId: WALLET_CONNECT_PROJECT_ID,
		});

		registerHooks(provider, options, callbacks);

		await provider.connect();

		if (provider.account) {
			return {
				success: true,
				account: makeCommonAccount(provider.account, options.networkId),
				provider: makeCommonProvider(provider),
			};
		}
	} catch (e) {
		console.error("WalletConnect connect error:", e);
		options.onDisconnected();
	}
}

export const _wcDisconnect = async (
	provider: CommonProvider,
): Promise<void> => {
	console.log("disconnecting wallet connect provider");
	await provider.disconnect();
	console.log("disconnected wallet connect provider");
};

export const _wcAutoConnect = async (
	options: ConnectionOptions & ProviderOptions,
	callbacks: Partial<ProviderCallbacks> = {},
): Promise<ConnectResult | undefined> => {
	try {
		const provider = await WalletConnectProvider.init({
			projectId: WALLET_CONNECT_PROJECT_ID,
			networkId: options.networkId,
			addressGroup: options.addressGroup,
			onDisconnected: options.onDisconnected,
		});

		const isPreauthorized = provider.isPreauthorized();

		if (!isPreauthorized) {
			return undefined;
		}

		registerHooks(provider, options, callbacks);

		await provider.connect();

		if (provider.account) {
			return {
				success: true,
				account: makeCommonAccount(provider.account, options.networkId),
				provider: makeCommonProvider(provider),
			};
		}
	} catch (e) {
		console.error(`WalletConnect auto-connect error: ${e}`);
		options.onDisconnected();
	}
	return undefined;
};
