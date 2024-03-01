import { reactive } from "vue";
import {
	signIn as discordSignIn,
	signOut as discordSignOut,
} from "../utils/authjs-client";

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

const session = reactive<Session>(createEmptySession());

function setLoaded() {
	session.loaded = true;
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

export function useDiscord() {
	return { session, loadSession, signIn, signOut, setLoaded };
}
