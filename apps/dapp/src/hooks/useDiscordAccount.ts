import { computed, onMounted, reactive, ref } from "vue";
import {
	signIn as discordSignIn,
	signOut as discordSignOut,
} from "../utils/authjs-client";
import nProgress from "nprogress";
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

	const timer = 500;
	let tries = 300000; // 5 minutes
	const interval = setInterval(async () => {
		tries -= timer;
		const resp = await loadSession();
		if (resp?.user?.name) {
			clearInterval(interval);
			// TODO: redirect from login page to overview or something
		} else if (tries <= 0) {
			clearInterval(interval);
			console.warn("Could not find user before time expired");
		}
	}, timer);
}

async function signOut() {
	// clear all info
	// redirect to home page
	// update session info
	await discordSignOut();
	const y = await loadSession();
	// TODO: redirect to home page and clear settings
}

async function loadSession() {
	const session_ = await fetch(
		`${import.meta.env.VITE_API_ENDPOINT}/api/auth/session`,
		{
			credentials: "include",
		},
	).then((a) => a.json());

	setLoaded();

	if (session_) {
		session.expires = session_.expires;
		session.user = session_.user;
	} else {
		session.expires = null;
		session.user.name = null;
		session.user.email = null;
		session.user.image = null;
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

interface UseDiscordAccountOptions {
	loadWalletsOnMount: true;
}

export function useDiscordAccount(options?: UseDiscordAccountOptions) {
	if (options?.loadWalletsOnMount) {
		refreshWallets();
	}

	return {
		// auth management
		session,
		loadSession,
		signIn,
		signOut,
		setLoaded,
		// wallet management
		saveUnverifiedWallet,
		wallets,
		deleteWallet,
		refreshWallets,
		tipBotAddress,
		setTipBotAddress,
	};
}
