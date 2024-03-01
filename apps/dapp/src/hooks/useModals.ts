import { computed, ref } from "vue";
import ConnectModal from "../components/ConnectModal.vue";

const modalComponents = {
	connectWallet: ConnectModal,
};

const modals = ref<Set<keyof typeof modalComponents>>(new Set());

const callbacks = ref(
	new Map<
		keyof typeof modalComponents,
		Set<(success: boolean, data?: unknown) => void>
	>(),
);

const hasModals = computed(() => modals.value.size > 0);

function pushModal(modalName: keyof typeof modalComponents) {
	modals.value.add(modalName);
}

export function useModals() {
	function onModalClose(
		modalName: keyof typeof modalComponents,
		callback: (success: boolean, data?: unknown) => void,
	) {
		if (!callbacks.value.has(modalName)) {
			callbacks.value.set(modalName, new Set());
		}
		callbacks.value.get(modalName)?.add(callback);
		console.log({ callbacks });
	}

	function popModal<T = unknown>(success: boolean, data?: T) {
		if (hasModals.value) {
			const next = modals.value.keys().next().value;
			modals.value.delete(next);
			for (const cb of callbacks.value.get(next) ?? []) {
				cb(success, data);
			}

			if (success) {
				callbacks.value.delete(next);
			}
		}
	}

	return {
		modals,
		modalComponents,
		hasModals,
		popModal,
		pushModal,
		onModalClose,
	};
}
