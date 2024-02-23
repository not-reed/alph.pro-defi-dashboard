import { onBeforeMount, onMounted, reactive, ref } from "vue";
import { connector as desktop } from "../connectors/desktopWalletConnect";
import { connector as injected } from "../connectors/injected";
import { connector as qrcode } from "../connectors/qrCodeWalletConnect";
import { Storage, StorageKeys } from "../connectors/storage";
import { ConnectionOptions } from "../connectors/types";
import { useAccount } from "./useAccount";
import { useProvider } from "./useProvider";
import { useTotalSupply } from "./useTotalSupply";
import { loadDeployments } from "@repo/vending-machine/artifacts/ts/deployments";
import { NodeProvider, web3 } from "@alephium/web3";
import { useToast } from "vue-toastification";
import { labels } from "../data";
import { useMint } from "./useMint";
import nProgress from "nprogress";

<<<<<<< HEAD
const { amounts } = useTotalSupply();
const { pending } = useMint();
||||||| d834aff
const { amounts } = useTotalSupply()
const { pending } = useMint()
=======
const { amounts, setAmounts } = useTotalSupply();
const { pending } = useMint();
>>>>>>> main
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
<<<<<<< HEAD
>({
	networkId: import.meta.env.VITE_NETWORK_ID,
	addressGroup: 0,
	keyType: "default",
});
||||||| d834aff
>(
	{
		networkId: import.meta.env.VITE_NETWORK_ID,
		addressGroup: 0,
		keyType: "default",
	},
);
=======
>({
	networkId: import.meta.env.VITE_NETWORK_ID,
	addressGroup: 0,
	keyType: "default",
});

async function setInitialTotals() {
	web3.setCurrentNodeProvider("https://wallet-v20.mainnet.alephium.org");
	const instance = loadDeployments(import.meta.env.VITE_NETWORK_ID).contracts
		.VendingMachine?.contractInstance;
	if (!instance) {
		return;
	}

	const state = await instance.fetchState();

	const totals = [];
	for (const i in state.fields.mintedFoods) {
		totals.push(Number(state.fields.mintedFoods[i]) - 50 * Number(i));
	}
	setAmounts(totals);
}
>>>>>>> main

async function getAmounts(nodeProvider: NodeProvider) {
	const toast = useToast();
<<<<<<< HEAD
	const { account } = useAccount();
	web3.setCurrentNodeProvider(nodeProvider);
	const instance = loadDeployments(import.meta.env.VITE_NETWORK_ID).contracts
		.VendingMachine?.contractInstance;
||||||| d834aff
	const { account } = useAccount()
	web3.setCurrentNodeProvider(nodeProvider)
	const instance = loadDeployments(import.meta.env.VITE_NETWORK_ID).contracts.VendingMachine?.contractInstance
=======
	const { account } = useAccount();
>>>>>>> main

<<<<<<< HEAD
	let showToasts = false;
	instance?.subscribeNftMintedEvent({
		pollingInterval: 5,
		messageCallback: async (event) => {
			console.log(event);
			const foodType = Math.floor(Number(event.fields.startingIndex) / 50);
			const startAmount = Number(event.fields.startingIndex) % 50;
			const mintAmount = Number(event.fields.mintAmount) - 1;
			amounts.value[foodType] = startAmount + mintAmount;
||||||| d834aff
	let showToasts = false
	instance?.subscribeNftMintedEvent({
		pollingInterval: 5,
		messageCallback: async (event) => {		
			console.log(event)
			const foodType = Math.floor(Number(event.fields.startingIndex) / 50)
			const startAmount = Number(event.fields.startingIndex) % 50
			const mintAmount = Number(event.fields.mintAmount) - 1
			amounts.value[foodType] = startAmount + mintAmount
=======
	const instance = loadDeployments(import.meta.env.VITE_NETWORK_ID).contracts
		.VendingMachine?.contractInstance;
	if (!instance) {
		return;
	}
	let showToasts = false;
	instance?.subscribeNftMintedEvent(
		{
			pollingInterval: 1,
			messageCallback: async (event) => {
				console.log({ event });
				const foodType = Math.floor(Number(event.fields.startingIndex) / 50);
				const startAmount = Number(event.fields.startingIndex) % 50;
				const mintAmount = Number(event.fields.mintAmount) - 1;
				amounts.value[foodType] = startAmount + mintAmount;
>>>>>>> main

<<<<<<< HEAD
			if (showToasts) {
				if (event.fields.minter === account.address) {
					pending.value.delete(event.txId);
					if (pending.value.size === 0) {
						nProgress.done();
||||||| d834aff
			if (showToasts) {
				if (event.fields.minter === account.address) {
					pending.value.delete(event.txId)
					if (pending.value.size === 0) {
						nProgress.done()
=======
				if (showToasts) {
					if (event.fields.minter === account.address) {
						pending.value.delete(event.txId);
						if (pending.value.size === 0) {
							nProgress.done();
						}
						toast.success(`You Minted ${mintAmount + 1} ${labels[foodType]}`);
					} else {
						toast.warning(
							`Someone grabbed ${mintAmount + 1} ${labels[foodType]}`,
						);
>>>>>>> main
					}
<<<<<<< HEAD
					toast.success(`You Minted ${mintAmount + 1} ${labels[foodType]}`);
||||||| d834aff
					toast.success(`You Minted ${mintAmount + 1} ${labels[foodType]}`)
=======
>>>>>>> main
				} else {
<<<<<<< HEAD
					toast.warning(
						`Someone grabbed ${mintAmount + 1} ${labels[foodType]}`,
					);
||||||| d834aff
					toast.warning(`Someone grabbed ${mintAmount + 1} ${labels[foodType]}`)
=======
					setTimeout(() => {
						showToasts = true;
					}, 750);
>>>>>>> main
				}
<<<<<<< HEAD
			} else {
				setTimeout(() => {
					showToasts = true;
				}, 500);
			}
||||||| d834aff
			} else {
				setTimeout(() => {
					showToasts = true
				}, 500)
			}
=======
			},
			errorCallback: async (error) => {
				console.log("something happened");
				console.log({ error });
			},
>>>>>>> main
		},
<<<<<<< HEAD
		errorCallback: async (error) => {
			console.log("something happened");
			console.log({ error });
		},
	});
||||||| d834aff
		errorCallback: async (error) => {
			console.log("something happened")
			console.log({ error })
		}
	})
=======
		265,
	);
>>>>>>> main
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
		// @ts-ignore
		onDisconnected: (...args: unknown[]) => {
			console.log("disconnected");
		},
		// @ts-ignore
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

		connectorId.value = id;

		if (results?.success) {
			// Save Values for Auto-Connect
			if (rememberMe) {
				Storage.set(StorageKeys.LastUsedConnectorId, id);
				Storage.set(StorageKeys.LastUsedConnectionOptions, opts);
			}
<<<<<<< HEAD
			getAmounts(results.provider.nodeProvider);
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
||||||| d834aff
			getAmounts(results.provider.nodeProvider)
=======
			getAmounts(results.provider.nodeProvider);
>>>>>>> main
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
<<<<<<< HEAD
			getAmounts(results.provider.nodeProvider);
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
||||||| d834aff
			getAmounts(results.provider.nodeProvider)
=======
			getAmounts(results.provider.nodeProvider);
>>>>>>> main
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
			setInitialTotals,
		};
	}

	return {
		//hack for page load
		setInitialTotals,
		connect,
		disconnect,
		autoConnect,
	};
}
