<script setup lang="ts">
import { useRouter } from 'vue-router';
import {
    TransitionRoot,
    TransitionChild,
    Dialog,
    DialogPanel,
    DialogTitle,
} from '@headlessui/vue'
import { AlephiumConnect, useAccount } from '@alphpro/web3-vue'

const { account } = useAccount()
const router = useRouter()


async function connectWith(connectCallback: () => Promise<void>) {
    await connectCallback()
    closeModal()
}


defineProps<{ open: boolean }>()
const emits = defineEmits(['close'])

function closeModal() {
    emits('close')
}

</script>

<template>
    <TransitionRoot appear :show="open" as="template">
        <Dialog as="div" @close="closeModal" class="relative z-10">
            <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0" enter-to="opacity-100"
                leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0">
                <div class="fixed inset-0 bg-zinc-800/50" />
            </TransitionChild>

            <div class="fixed inset-0 overflow-y-auto">
                <div class="flex min-h-full items-center justify-center p-4 text-center">
                    <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0 scale-95"
                        enter-to="opacity-100 scale-100" leave="duration-200 ease-in" leave-from="opacity-100 scale-100"
                        leave-to="opacity-0 scale-95">
                        <DialogPanel
                            class="w-full max-w-md transform overflow-hidden rounded-2xl dark:bg-calypso-800  p-6 text-left align-middle shadow-xl transition-all">
                            <DialogTitle as="h3" class="text-xl text-gray-900 dark:text-gray-300">
                                Alph.Pro
                            </DialogTitle>
                            <div class="mt-2">
                                <p class="text-sm text-gray-500 dark:text-gray-300">
                                    Connect your wallet
                                </p>
                            </div>
                            <AlephiumConnect v-slot="{ connectExtension, connectDesktop, connectWalletConnect }">
                                <div class="mt-4 flex gap-2">
                                    <button type="button"
                                        class="inline-flex justify-center rounded-md border border-transparent dark:bg-calypso-600 px-4 py-2 text-sm font-bold transition dark:text-calypso-300 dark:hover:text-calypso-200 dark:hover:bg-calypso-700"
                                        @click="connectWith(connectExtension)">
                                        Extension
                                    </button>
                                    <button type="button"
                                        class="inline-flex justify-center rounded-md border border-transparent dark:bg-calypso-600 px-4 py-2 text-sm font-bold transition dark:text-calypso-300 dark:hover:text-calypso-200 dark:hover:bg-calypso-700"
                                        @click="connectWith(connectWalletConnect)">
                                        Wallet Connect
                                    </button>
                                    <button type="button"
                                        class="inline-flex justify-center rounded-md border border-transparent dark:bg-calypso-600 px-4 py-2 text-sm font-bold transition dark:text-calypso-300 dark:hover:text-calypso-200 dark:hover:bg-calypso-700"
                                        @click="connectWith(connectDesktop)">
                                        Desktop
                                    </button>
                                </div>
                            </AlephiumConnect>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </div>
        </Dialog>
    </TransitionRoot>
</template>
