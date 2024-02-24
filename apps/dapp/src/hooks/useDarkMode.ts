// On page load or when changing themes, best to add inline in `head` to avoid FOUC

import { ref } from "vue";

type Theme = "light" | "dark" | "system";

const mode = ref<Theme>(getInitialTheme());

function getInitialTheme(): Theme {
	const persistedTheme = localStorage.getItem("theme");
	const hasPersistedPreference = typeof persistedTheme === "string";

	if (hasPersistedPreference) {
		return persistedTheme as Theme;
	}

	return "system";
}

matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
	if (!e.matches) {
		return;
	}
	if (mode.value !== "system") {
		return;
	}
	setDark();
});
matchMedia("(prefers-color-scheme: light)").addEventListener("change", (e) => {
	if (!e.matches) {
		return;
	}
	if (mode.value !== "system") {
		return;
	}
	setLight();
});

function setSystem() {
	document.documentElement.classList.remove("dark");
	localStorage.removeItem("theme");
	mode.value = "system";
}

function setDark() {
	document.documentElement.classList.add("dark");
	if (mode.value === "system") {
		return;
	}
	localStorage.theme = "dark";
	mode.value = "dark";
}

function setLight() {
	document.documentElement.classList.remove("dark");
	if (mode.value === "system") {
		return;
	}
	localStorage.theme = "light";
	mode.value = "light";
}

const transitions: Record<Theme, Theme> = {
	system: "dark",
	dark: "light",
	light: "system",
};
function nextTheme() {
	mode.value = transitions[mode.value];
	switch (mode.value) {
		case "system":
			setSystem();
			break;
		case "dark":
			setDark();
			break;
		case "light":
			setLight();
			break;
	}
}

export function useDarkMode() {
	return {
		mode,
		nextTheme,
		setSystem,
		setDark,
		setLight,
	};
}
