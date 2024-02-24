import { AlephiumWindowObject } from "@alephium/get-extension-wallet";
import { WalletConnectProvider } from "@alephium/walletconnect-provider";
import { Account, KeyType, NetworkId } from "@alephium/web3";
import { CommonProvider } from "./utils";

export type IntersectedSignerProvider =
	| WalletConnectProvider
	| AlephiumWindowObject;

interface ConnectResultSuccess {
	success: true;
	account: Account;
	provider: CommonProvider;
}

interface ConnectResultFailure {
	success: false;
	account: undefined;
	provider: undefined;
}
export type ConnectResult = ConnectResultSuccess | ConnectResultFailure;

export interface ConnectionOptions {
	networkId: NetworkId;
	addressGroup: number;
	keyType: KeyType;
	onDisconnected: (...args: unknown[]) => void;
	onConnected: (...args: unknown[]) => void;
}

export interface Connector {
	connect: (options: ConnectionOptions) => Promise<ConnectResult | undefined>;
	autoConnect: (
		options: ConnectionOptions,
	) => Promise<ConnectResult | undefined>;
	disconnect: (provider: CommonProvider) => Promise<void>;
}
