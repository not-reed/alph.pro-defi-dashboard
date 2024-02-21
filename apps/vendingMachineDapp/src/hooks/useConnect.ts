import { reactive, ref } from "vue";
import { connector as desktop } from "../connectors/desktopWalletConnect";
import { connector as injected } from "../connectors/injected";
import { connector as qrcode } from "../connectors/qrCodeWalletConnect";
import { Storage, StorageKeys } from "../connectors/storage";
import { ConnectionOptions } from "../connectors/types";
import { useAccount } from "./useAccount";
import { useProvider } from "./useProvider";
import { useTotalSupply } from "./useTotalSupply";
import { loadDeployments } from "@repo/vending-machine/artifacts/ts/deployments"
import { NodeProvider, web3 } from "@alephium/web3";
import { useToast } from "vue-toastification";
import { labels } from "../data";

const { setAmounts, amounts } = useTotalSupply()
export const connectorIds = [
	"injected",
	"walletConnect",
	"desktopWallet",
] as const;
export type ConnectorId = (typeof connectorIds)[number];

const connectorId = ref<ConnectorId | undefined>(
	Storage.get(StorageKeys.LastUsedConnectorId),
);

const cachedConnectionOptions = reactive<
	Pick<ConnectionOptions, "networkId" | "addressGroup" | "keyType">
>(
	Storage.get(StorageKeys.LastUsedConnectionOptions) ?? {
		networkId: import.meta.env.VITE_NETWORK_ID,
		addressGroup: 0,
		keyType: "default",
	},
);

async function getAmounts(nodeProvider: NodeProvider) {
	const toast = useToast();
	const { account } = useAccount()
	web3.setCurrentNodeProvider(nodeProvider)
	const instance = loadDeployments(import.meta.env.VITE_NETWORK_ID).contracts.VendingMachine?.contractInstance

	let showToasts = false
	instance?.subscribeNftMintedEvent({
		pollingInterval: 5,
		messageCallback: async (event) => {		
			console.log(event)
			const foodType = Math.floor(Number(event.fields.startingIndex) / 50)
			const startAmount = Number(event.fields.startingIndex) % 50
			const mintAmount = Number(event.fields.mintAmount) - 1
			amounts.value[foodType] = startAmount + mintAmount

			if (showToasts) {
				if (event.fields.minter === account.address) {
					toast.success(`You Minted ${mintAmount + 1} ${labels[foodType]}`)
				} else {
					toast.warning(`Someone grabbed ${mintAmount + 1} ${labels[foodType]}`)
				}
			} else {
				setTimeout(() => {
					showToasts = true
				}, 500)
			}
		},
		errorCallback: async (error) => {
			console.log("something happened")
			console.log({ error })
		}
	})
}

function getConnector(connector: ConnectorId) {
	switch (connector) {
		case "injected":
			return injected;
		case "walletConnect":
			return qrcode;
		case "desktopWallet":
			return desktop;
	}
}

export function useConnect(rememberMe = true) {
	const defaultConnectionCallbacks = {
		onDisconnected: (...args: unknown[]) => {
			console.log("disconnected");
		},
		onConnected: (...args: unknown[]) => {
			console.log("connected");
		},
	} satisfies Pick<ConnectionOptions, "onDisconnected" | "onConnected">;

	const { account, setAccount, clearAccount } = useAccount();
	const { getProvider, setProvider, clearProvider } = useProvider();

	const connect = async (
		id: ConnectorId,
		options?: Partial<ConnectionOptions>,
	) => {
		const opts = { ...cachedConnectionOptions, ...options };
		const results = await getConnector(id).connect({
			...defaultConnectionCallbacks,
			...opts,
		});

		console.log({ results });
		connectorId.value = id;

		if (results?.success) {
			
			// Save Values for Auto-Connect
			if (rememberMe) {
				Storage.set(StorageKeys.LastUsedConnectorId, id);
				Storage.set(StorageKeys.LastUsedConnectionOptions, opts);
			}
			getAmounts(results.provider.nodeProvider)
			setAccount(results.account as any);
			setProvider(results.provider);
			return results;
		}
	};

	const disconnect = async () => {
		const provider = getProvider();

		if (connectorId.value && provider) {
			await getConnector(connectorId.value).disconnect(provider);
		}

		clearAccount();
		clearProvider();
		if (rememberMe) {
			Storage.remove(StorageKeys.LastUsedConnectorId);
			Storage.remove(StorageKeys.LastUsedConnectionOptions);
		}
	};

	const autoConnect = async () => {
		// don't log in if already logged in, or not previously logged in
		if (!connectorId.value || account.address) {
			// no auto connection available
			return;
		}

		const results = await getConnector(connectorId.value).autoConnect({
			...cachedConnectionOptions,
			...defaultConnectionCallbacks,
		});

	

		if (results?.success) {
			getAmounts(results.provider.nodeProvider)
			setAccount(results.account as any);
			setProvider(results.provider);
			return results;
		}
	};

	if (!rememberMe) {
		return {
			connect,
			disconnect,
			autoConnect: () => {},
		};
	}

	return {
		connect,
		disconnect,
		autoConnect,
	};
}
