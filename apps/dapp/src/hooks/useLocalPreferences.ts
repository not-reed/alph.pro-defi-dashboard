import { reactive, watch } from "vue";

const KEY_PREFIX = "alph.pro:preferences";

function getCachedPreferences() {
	return Object.fromEntries(
		Object.entries({ ...localStorage }).filter(([key]) =>
			key.startsWith(KEY_PREFIX),
		),
	);
}

const preferences = reactive(getCachedPreferences());

function hasPreference(key: string) {
	return localStorage.getItem(`${KEY_PREFIX}:${key}`) !== null;
}

function getPreference(key: string) {
	return (
		preferences[key] ??
		JSON.parse(localStorage.getItem(`${KEY_PREFIX}:${key}`) ?? "null")
	);
}

function setPreference(key: string, value: unknown) {
	localStorage.setItem(`${KEY_PREFIX}:${key}`, JSON.stringify(value));
	preferences[key] = value;
}

function clearPreference(key: string) {
	localStorage.removeItem(`${KEY_PREFIX}:${key}`);
	preferences[key] = null;
}

watch(preferences, (newPreferences) => {
	const tmp = new Set(Object.keys(getCachedPreferences()));

	for (const [key, value] of Object.entries(newPreferences)) {
		tmp.delete(key);
		localStorage.setItem(`${KEY_PREFIX}:${key}`, JSON.stringify(value));
	}

	for (const key of tmp) {
		localStorage.removeItem(`${KEY_PREFIX}:${key}`);
	}
});

export function useLocalPreferences() {
	return {
		preferences,
		hasPreference,
		getPreference,
		setPreference,
		clearPreference,
	};
}
