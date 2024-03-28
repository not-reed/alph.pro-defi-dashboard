<script setup lang=ts>
import { ref } from 'vue';
import { useUser } from '../hooks/useUser'
import { useRouter } from 'vue-router';
import {
    TransitionRoot,
    TransitionChild,
    Dialog,
    DialogPanel,
    DialogTitle,
} from '@headlessui/vue'
import { useAlephiumConnect } from '../hooks/useAlephiumConnect';
import { ConnectorId } from '../utils/connectors/constants';
import { useDiscordAccount } from '../hooks/useDiscordAccount';
import { useAlephiumAccount } from '../hooks/useAlephiumAccount';


const { user, setWallet } = useUser()
const { account } = useAlephiumAccount()
const { connect } = useAlephiumConnect()
const { session } = useDiscordAccount()
const router = useRouter()
const wallet = ref(user.wallet)


async function connectWith(id: ConnectorId) {
    await connect(id)

    closeModal()
    router.push(`/portfolio/overview/${account.address}`)
}


function viewWallet() {
    setWallet(wallet.value)
    router.push(`/portfolio/overview/${wallet.value}`)
}

const isOpen = ref(false)

function closeModal() {
    isOpen.value = false
}
function openModal() {
    isOpen.value = true
}

</script>

<template>
    <div class="flex flex-col gap-8 items-center justify-center h-dvh md:h-full -mb-10">

        <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" viewBox="0 0 82.2 93.2"
            class="w-32 h-32 text-calypso-200">
            <path fill="currentColor" d="M0 93.2 41 0l41.2 93.1H27.6l6.2-14 28.2.1-21-47.8-27.2 61.8z" />
        </svg>

        <form @submit.prevent class="flex flex-col w-full gap-8 max-w-xl">
            <input v-model="wallet" type="text"
                class="m-2 md:scale-95 focus:scale-100 transition dark:text-emerald-200 px-4 py-2 rounded bg-zinc-100 dark:bg-calypso-900 shadow-xl md:text-xl placeholder-calypso-500 placeholder-opacity-25"
                placeholder="1CHYuhea7uaupotv2KkSwNLaJWYeNouDp4QffhkhTxKpr" />
            <div class="flex flex-col md:flex-row items-center gap-8 justify-center ">
                <button
                    class="w-full md:w-36 scale-95 transition px-4 py-2 bg-zinc-200 dark:bg-calypso-800 rounded text-xl shadow-xl text-zinc-600 dark:text-emerald-200"
                    type="submit" @click="viewWallet"
                    :class="wallet.length ? 'opacity-100 focus:scale-100 hover:scale-100' : 'opacity-50'">
                    View
                </button>


                <button @click="openModal"
                    class="w-full md:w-36 scale-95 transition px-4 py-2 bg-zinc-200 dark:bg-calypso-800 rounded text-xl shadow-xl text-zinc-600 dark:text-emerald-200"
                    :class="wallet.length ? 'opacity-50' : 'opacity-100 focus:scale-100 hover:scale-100'">
                    Connect
                </button>

                <button :disabled="Boolean(session.user.name)"
                    :class="session.user.name ? 'opacity-50 cursor-not-allowed' : 'opacity-100 focus:scale-100 hover:scale-100'"
                    class="w-full md:w-36 scale-95 transition px-4 py-2 bg-zinc-200 dark:bg-calypso-800 rounded text-xl shadow-xl text-zinc-600 dark:text-emerald-200">
                    Discord
                </button>
            </div>
        </form>
    </div>

    <TransitionRoot appear :show="isOpen" as="template">
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

                            <div class="mt-4 flex gap-2">
                                <button type="button"
                                    class="inline-flex justify-center rounded-md border border-transparent dark:bg-calypso-600 px-4 py-2 text-sm font-bold transition dark:text-calypso-300 dark:hover:text-calypso-200 dark:hover:bg-calypso-700"
                                    @click="connectWith('injected')">
                                    Extension
                                </button>
                                <button type="button"
                                    class="inline-flex justify-center rounded-md border border-transparent dark:bg-calypso-600 px-4 py-2 text-sm font-bold transition dark:text-calypso-300 dark:hover:text-calypso-200 dark:hover:bg-calypso-700"
                                    @click="connectWith('walletConnect')">
                                    Wallet Connect
                                </button>
                                <button type="button"
                                    class="inline-flex justify-center rounded-md border border-transparent dark:bg-calypso-600 px-4 py-2 text-sm font-bold transition dark:text-calypso-300 dark:hover:text-calypso-200 dark:hover:bg-calypso-700"
                                    @click="connectWith('desktopWallet')">
                                    Desktop
                                </button>
                            </div>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </div>
        </Dialog>
    </TransitionRoot>
</template>../hooks/useAlephiumAccount
