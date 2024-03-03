import { ref } from "vue";
import { CommonProvider } from "../utils/connectors/utils";

let raw: CommonProvider | null = null;
const provider = ref<CommonProvider | null>(raw);

function getProvider(): CommonProvider {
	if (!raw) {
		throw new Error("Provider not set");
	}
	return raw;
}
function setProvider(value: CommonProvider) {
	raw = value;
	provider.value = value;
}

function clearProvider() {
	provider.value = null;
	raw = null;
}

export function useAlephiumProvider() {
	return { provider, getProvider, setProvider, clearProvider };
}
