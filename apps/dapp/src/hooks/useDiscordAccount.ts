import { computed, onMounted, reactive, ref } from "vue";
import {
	signIn as discordSignIn,
	signOut as discordSignOut,
} from "../utils/authjs-client";
import nProgress from "nprogress";
import { useAccount, useProvider } from "@alphpro/web3-vue";
/**
 * Interfaces
 */
type Session =
	| {
			loaded: true;
			expires: string;
			user: {
				name: string;
				email: string;
				image: string;
			};
	  }
	| {
			loaded: boolean;
			expires: null;
			user: {
				name: null;
				email: null;
				image: null;
			};
	  };

interface Wallet {
	address: string;
	verified: boolean;
	isTipBot: boolean;
}

/** Factories */
function createEmptySession(): Session {
	return {
		loaded: false,
		expires: null,
		user: {
			name: null,
			email: null,
			image: null,
		},
	};
}

/**
 * State
 */
const session = reactive<Session>(createEmptySession());

const subscription = reactive<{ expires: Date | null }>({ expires: null });
const isActiveSubscription = computed(() => {
	if (!subscription.expires) return false;
	return new Date() < subscription.expires;
});

const wallets = ref<Wallet[]>([]);
const tipBotAddress = computed(
	() => wallets.value.find((a) => a.isTipBot)?.address ?? "",
);

function setLoaded() {
	session.loaded = true;
}

/**
 * Discord Auth Functions
 */

async function signIn() {
	// signing using auth-client
	// update session info
	await discordSignIn("discord");

	return new Promise((resolve, reject) => {
		const timer = 1500;
		let tries = 300000; // 5 minutes
		const interval = setInterval(async () => {
			tries -= timer;
			const resp = await loadSession();
			if (resp?.user?.name) {
				clearInterval(interval);
				// TODO: redirect from login page to overview or something
				resolve(null);
			} else if (tries <= 0) {
				clearInterval(interval);
				console.warn("Could not find user before time expired");
				reject();
			}
		}, timer);
	});
}

async function signOut() {
	// clear all info
	// redirect to home page
	// update session info
	await discordSignOut();
	const y = await loadSession();
	subscription.expires = null;
	// TODO: redirect to home page and clear settings
	// localStorage.clear();
	// window.location.href = "/";
}

async function loadSession() {
	const session_ = await fetch(
		`${import.meta.env.VITE_API_ENDPOINT}/api/auth/session`,
		{
			credentials: "include",
		},
	).then((a) => a.json());

	if (session_) {
		const subscription_ = await fetch(
			`${import.meta.env.VITE_API_ENDPOINT}/api/wallets/subscription`,
			{
				credentials: "include",
			},
		).then((a) => a.json());

		if (subscription_.subscription?.expires) {
			subscription.expires = new Date(subscription_.subscription?.expires);
		}
	}

	setLoaded();

	if (session_) {
		session.expires = session_.expires;
		session.user = session_.user;
	} else {
		Object.assign(session, createEmptySession());
		// session.expires = null;
		// session.user.name = null;
		// session.user.email = null;
		// session.user.image = null;
	}
	return session_;
}

/**
 * Wallet Management
 */
async function refreshWallets() {
	const response = await fetch(
		`${import.meta.env.VITE_API_ENDPOINT}/api/wallets`,
		{ credentials: "include" },
	).then((a) => a.json());

	wallets.value = response.wallets;
}

async function saveUnverifiedWallet(address: string) {
	nProgress.start();
	try {
		await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/wallets`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ address }),
			credentials: "include",
		});
		await refreshWallets();
	} finally {
		nProgress.done();
	}
}

async function deleteWallet(address: string) {
	nProgress.start();
	try {
		await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/wallets`, {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ address }),
			credentials: "include",
		});
		await refreshWallets();
	} finally {
		nProgress.done();
	}
}

async function setTipBotAddress(address: string) {
	const resp = await fetch(
		`${import.meta.env.VITE_API_ENDPOINT}/api/wallets/tip-bot`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ address }),
			credentials: "include",
		},
	).then((a) => a.json());
	console.log({ resp, address });
	await refreshWallets();
}

async function signWallet() {
	const { account } = useAccount();
	const { getProvider } = useProvider();

	const { message } = await fetch(
		`${import.meta.env.VITE_API_ENDPOINT}/api/web3/get-challenge`,
		{
			method: "POST",
			credentials: "include",
			body: JSON.stringify({
				address: account.address,
				publicKey: account.publicKey,
			}),
		},
	).then((a) => a.json());

	const result = await getProvider().signer?.signMessage({
		message: message,
		messageHasher: "alephium",
		signerAddress: account.address,
	});

	// no need to store token, we will refresh wallet list and if its verified it will be displayed as such
	await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/web3/verify`, {
		method: "POST",
		credentials: "include",
		body: JSON.stringify({
			address: account.address,
			signature: result?.signature,
			publicKey: account.publicKey,
		}),
	}).then((a) => a.json());

	await refreshWallets();
}

export function useDiscordAccount() {
	return {
		// auth management
		session,
		loadSession,
		signIn,
		signOut,
		setLoaded,
		// subscription
		subscription,
		isActiveSubscription,
		// wallet management
		saveUnverifiedWallet,
		wallets,
		signWallet,
		deleteWallet,
		refreshWallets,
		tipBotAddress,
		setTipBotAddress,
	};
}
