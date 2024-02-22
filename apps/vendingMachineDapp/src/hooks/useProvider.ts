import { ref } from "vue";
import { CommonProvider } from "../connectors/utils";

// non-reactive therefor we must call getProvider on demand
// let provider: CommonProvider | null = null;
const provider = ref<CommonProvider | null>(null as any);
let raw: CommonProvider | null = null;

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

export function useProvider() {
	return { provider, getProvider, setProvider, clearProvider };
}
