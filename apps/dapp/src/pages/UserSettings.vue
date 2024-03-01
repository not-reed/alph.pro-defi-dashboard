<script setup lang="ts">
import { CheckBadgeIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { ExclamationCircleIcon } from '@heroicons/vue/24/solid';
import nProgress from 'nprogress';
import { computed, onMounted, ref } from 'vue';
import { useUser } from '../hooks/useUser';
import { useRouter } from 'vue-router';
import { useAccount } from '../hooks/useAccount';
import { useConnect } from '../hooks/useConnect';
import {
    TransitionRoot,
    TransitionChild,
    Dialog,
    DialogPanel,
    DialogTitle,
} from '@headlessui/vue'
import { ConnectorId } from '../utils/connectors/constants';
import { useProvider } from '../hooks/useProvider';

const isOpen = ref(false)

function closeModal() {
    isOpen.value = false
}
function openModal() {
    isOpen.value = true
}


const { setWallet } = useUser()
const { account } = useAccount()
const { connect, disconnect } = useConnect()
const { provider, getProvider } = useProvider()

const router = useRouter()

const wallets = ref<{ address: string, verified: boolean, isTipBot: boolean }[]>([])
const tipBotAddress = ref('')
async function refreshWallets() {
    const response: any = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/wallets`, { credentials: 'include' }).then(a => a.json())
    wallets.value = response.wallets

    tipBotAddress.value = wallets.value.find(a => a.isTipBot)?.address ?? ''
}
onMounted(async () => {
    await refreshWallets()
})

async function viewWallet(address: string) {
    setWallet(address)
    await router.push('/portfolio/overview')
}
let inputWallet = ref('')
async function saveWallet() {
    nProgress.start()
    try {

        await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/wallets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: inputWallet.value }),
            credentials: 'include'
        })
        await refreshWallets()
        inputWallet.value = ''
    } finally {
        nProgress.done()
    }
}

async function deleteWallet(address: string) {
    const confirmed = confirm('Are you sure you want to delete this wallet?')
    if (!confirmed) return;
    nProgress.start()
    try {
        await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/wallets`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address }),
            credentials: 'include'
        })
        await refreshWallets()
    } finally {
        nProgress.done()
    }
}

async function signWallet() {

    const { message } = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/web3/get-challenge`, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ address: account.address, publicKey: account.publicKey })
    }).then(a => a.json())


    let result = await getProvider().signer?.signMessage({
        message: message,
        messageHasher: 'alephium',
        signerAddress: account.address
    })

    // no need to store token, we will refresh wallet list and if its verified it will be displayed as such
    await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/web3/verify`, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ address: account.address, signature: result?.signature, publicKey: account.publicKey })
    }).then(a => a.json())


    await refreshWallets()
}

async function connectWith(id: ConnectorId) {
    await connect(id)

    if (!provider.value) {
        console.warn('No provider')
        return;
    }


    if (!wallets.value.some(wallet => wallet.address === account.address)) {
        await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/wallets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: account.address }),
            credentials: 'include'
        })
        await refreshWallets()
    }



    closeModal()
}

const activeAccountIsVerified = computed(() => {
    return wallets.value.some(a => a.address === account.address && a.verified)
})

async function setTipBot(address: string) {
    await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/wallets/tip-bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
        credentials: 'include'
    })
    await refreshWallets()
}

function formatAddress(address: string, maxLength = 24) {
    if (address.length <= maxLength) return address

    return `${address.slice(0, ((maxLength / 2) - 1))}...${address.slice(-1 * ((maxLength / 2) - 1))}`
}

</script>
<template>
    <div class="p-6 flex flex-col gap-9">
        <div class="flex">
            <div class="flex flex-col dark:bg-calypso-900 p-4 rounded">
                <div @click="openModal">Connect & Verify Wallet</div>
                <div class="flex gap-4">
                    <button class="px-4 py-2 rounded bg-calypso-800  transition" :disabled="!!account.address"
                        :class="account.address ? 'cursor-not-allowed opacity-50' : 'hover:bg-calypso-700'"
                        @click="openModal">
                        Connect
                    </button>

                    <button class="px-4 py-2 rounded bg-calypso-800 transition"
                        :disabled="!account.address || activeAccountIsVerified"
                        :class="!account.address || activeAccountIsVerified ? 'cursor-not-allowed opacity-50' : 'hover:bg-calypso-700 '"
                        @click="signWallet">Verify</button>
                    <button class="px-4 py-2 rounded bg-calypso-800 transition" :disabled="!account.address"
                        :class="!account.address ? 'cursor-not-allowed opacity-50' : 'hover:bg-calypso-700 '"
                        @click="disconnect">Disconnect</button>
                </div>
            </div>
        </div>

        <div class="flex">
            <div class="flex flex-col gap-4 dark:bg-calypso-900 rounded p-4 w-auto">
                <div @click="openModal">Add <span class="italic -mb-2">Watch-Only</span> Wallet</div>
                <form @submit.prevent="saveWallet" class="flex gap-2 -mt-4">
                    <input type="text" class="px-4 py-2 bg-calypso-700 w-96 rounded" v-model="inputWallet" />
                    <button class="px-4 py-2 rounded bg-calypso-800 hover:bg-calypso-700 transition">Watch</button>
                </form>
            </div>
        </div>

        <div class="flex">
            <ul class="dark:bg-calypso-900 rounded p-4 flex flex-col">
                <li class="grid grid-cols-2 gap-2 my-4">
                    <div class="font-bold text-xl">
                        Verified Wallets:
                    </div>

                    <div class="flex gap-2 items-center justify-center w-64">
                        <div class="flex-1 flex items-center justify-center text-emerald-500">Verified</div>
                        <div class="flex-1 flex items-center justify-center text-sky-500">TipBot</div>
                        <div class="flex-1 flex items-center justify-center text-red-700">Delete</div>
                    </div>

                </li>

                <li v-for="wallet in wallets" :key="wallet.address" class="grid grid-cols-2 gap-2">
                    <div @click="viewWallet(wallet.address)" class="hover:underline cursor-pointer">
                        {{ formatAddress(wallet.address) }}
                    </div>

                    <div class="flex gap-2 items-center justify-center w-64">
                        <div class="flex-1 flex items-center justify-center">
                            <CheckBadgeIcon class="w-8 h-8 text-emerald-500" v-if="wallet.verified" />
                            <ExclamationCircleIcon class="w-8 h-8 text-orange-400" v-else />
                        </div>

                        <div class="flex-1 flex items-center justify-center">
                            <label class="relative flex items-center p-3 rounded-full cursor-pointer"
                                v-if="wallet.verified">
                                <input name="color" type="radio" :value="wallet.address" v-model="tipBotAddress"
                                    @input="setTipBot(wallet.address)"
                                    class="peer relative h-5 w-5 cursor-pointer appearance-none rounded-full border border-calypso-300 text-calypso-600 transition-all" />
                                <span
                                    class="absolute text-sky-500 transition scale-0 pointer-events-none top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 peer-checked:scale-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 16 16"
                                        fill="currentColor">
                                        <circle data-name="ellipse" cx="8" cy="8" r="8"></circle>
                                    </svg>
                                </span>
                            </label>
                        </div>
                        <div class="flex-1 flex items-center justify-center">
                            <button @click="deleteWallet(wallet.address)">
                                <TrashIcon class="w-8 h-8 text-red-700" />
                            </button>
                        </div>
                    </div>
                </li>
            </ul>
        </div>
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
                                    Please first connect your wallet<br>Then sign the message to verify ownership
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
</template>
