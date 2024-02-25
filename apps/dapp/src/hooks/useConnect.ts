import { reactive, ref } from "vue";
import { connector as desktop } from "../utils/connectors/desktopWalletConnect";
import { connector as injected } from "../utils/connectors/injected";
import { connector as qrcode } from "../utils/connectors/qrCodeWalletConnect";
import { Storage, StorageKeys } from "../utils/connectors/storage";
import { ConnectionOptions } from "../utils/connectors/types";
import { Account, useAccount } from "./useAccount";
import { useProvider } from "./useProvider";
import { ConnectorId } from "../utils/connectors/constants";
import { POSITION, useToast } from "vue-toastification";

const toast = useToast();
const connectorId = ref<ConnectorId | undefined>(
	Storage.get(StorageKeys.LastUsedConnectorId),
);

const connectionOptions = reactive<
	Pick<ConnectionOptions, "networkId" | "addressGroup" | "keyType">
>({
	networkId: "mainnet",
	// addressGroup: 0,
	keyType: "default",
});

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

export function useConnect() {
	const defaultConnectionCallbacks = {
		onDisconnected: () => console.log("disconnected"),
		onConnected: () => console.log("connected"),
	} satisfies Pick<ConnectionOptions, "onDisconnected" | "onConnected">;

	const { account, setAccount, clearAccount } = useAccount();
	const { getProvider, setProvider, clearProvider } = useProvider();

	const connect = async (
		id: ConnectorId,
		options?: Partial<ConnectionOptions>,
	) => {
		const opts = { ...connectionOptions, ...options };
		const results = await getConnector(id).connect({
			...defaultConnectionCallbacks,
			...opts,
		});
		connectorId.value = id;

		if (results?.success) {
			// Save Values for Auto-Connect
			Storage.set(StorageKeys.LastUsedConnectorId, id);
			Storage.set(StorageKeys.LastUsedConnectionOptions, opts);
			setAccount(results.account as Account);
			setProvider(results.provider);

			toast(
				`Connected As ${results.account.address.slice(
					0,
					4,
				)}...${results.account.address.slice(-4)}`,
				{
					position: POSITION.BOTTOM_RIGHT,
					timeout: 5000,
					closeOnClick: true,
					pauseOnFocusLoss: true,
					pauseOnHover: true,
					draggable: true,
					draggablePercent: 0.6,
					showCloseButtonOnHover: false,
					hideProgressBar: true,
					closeButton: "button",
					// icon: MyIconComponent,
					rtl: false,
				},
			);
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
		Storage.remove(StorageKeys.LastUsedConnectorId);
		Storage.remove(StorageKeys.LastUsedConnectionOptions);
	};

	const autoConnect = async () => {
		// don't log in if already logged in, or not previously logged in
		if (!connectorId.value || account.address) {
			// no auto connection available
			return;
		}

		const results = await getConnector(connectorId.value).autoConnect({
			...connectionOptions,
			...defaultConnectionCallbacks,
		});

		if (results?.success) {
			setAccount(results.account as Account);
			setProvider(results.provider);
			// no need to update localStorage as it auto connected from memory
			return results;
		}
	};

	return {
		connect,
		disconnect,
		autoConnect,
	};
}
