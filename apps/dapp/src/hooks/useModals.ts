import { computed, ref } from "vue";
import ConnectModal from "../components/ConnectModal.vue";

const modalComponents = {
	connectWallet: ConnectModal,
};

const modals = ref<Set<keyof typeof modalComponents>>(new Set());

const hasModals = computed(() => modals.value.size > 0);

function popModal() {
	if (hasModals.value) {
		modals.value.delete(modals.value.keys().next().value);
	}
}

function pushModal(modalName: keyof typeof modalComponents) {
	modals.value.add(modalName);
}

export function useModals() {
	return {
		modals,
		modalComponents,
		hasModals,
		popModal,
		pushModal,
	};
}
