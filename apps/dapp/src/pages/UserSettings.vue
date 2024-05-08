<script setup lang="ts">
import { CheckBadgeIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { ExclamationCircleIcon } from '@heroicons/vue/24/solid';
import { AlephiumConnect, useAccount, useConnect } from '@alphpro/web3-vue'
import { computed, onMounted, ref } from 'vue';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/vue/24/outline'
import { useUser } from '../hooks/useUser';
import { useRouter } from 'vue-router';
import {
    TransitionRoot,
    TransitionChild,
    Dialog,
    DialogPanel,
    DialogTitle,
} from '@headlessui/vue'
import { useDiscordAccount } from '../hooks/useDiscordAccount';
import { truncateAddress } from '../utils/addresses';
import Subscriptions from '../components/Settings/Subscriptions.vue';
import ApiKeyManagement from '../components/Settings/ApiKeyManagement.vue';
import CurrencyDropdown from '../components/CurrencyDropdown.vue';
import { useDarkMode } from '../hooks/utils/useDarkMode';

const isOpen = ref(false)

function closeModal() {
    isOpen.value = false
}
function openModal() {
    isOpen.value = true
}

const { setWallet } = useUser()
const { onConnect } = useConnect();
const { account } = useAccount()
const router = useRouter()

onConnect(() => closeModal())



const { saveUnverifiedWallet, deleteWallet, refreshWallets, wallets, tipBotAddress, setTipBotAddress, signWallet, signOut } = useDiscordAccount()

async function signOutOfDiscord() {
    await signOut()
    router.push('/')
}

onMounted(async () => {
    await refreshWallets()
})


async function viewWallet(address: string) {
    setWallet(address)
    await router.push(`/portfolio/overview/${address}`)
}
const inputWallet = ref('')
async function saveWallet() {
    await saveUnverifiedWallet(inputWallet.value)
    inputWallet.value = ''
}

async function deleteSelectedWallet(address: string) {
    const confirmed = confirm('Are you sure you want to delete this wallet?')
    if (!confirmed) return;
    deleteWallet(address)
}

const activeAccountIsVerified = computed(() => {
    return wallets.value.some(a => a.address === account.address && a.verified)
})


const { mode, nextTheme } = useDarkMode()
</script>

<template>
    <div class="p-6 flex flex-col gap-9 max-w-2xl w-screen">

        <Subscriptions />

        <div class="flex flex-col gap-2 dark:bg-calypso-900 p-4">
            <div class="underline">
                Preferences
            </div>

            <div class="flex gap-2 items-center">
                <div class="opacity-50">Preferred Currency:</div>
                <CurrencyDropdown />
            </div>


            <div class="flex gap-2 items-center">
                <div class="opacity-50">Theme:</div>
                <div @click="nextTheme">
                    <SunIcon v-if="mode === 'light'" class="w-6 h-6" />
                    <MoonIcon v-if="mode === 'dark'" class="w-6 h-6" />
                    <ComputerDesktopIcon v-if="mode === 'system'" class="w-6 h-6" />
                </div>
            </div>


            <!-- <div class="flex gap-2 items-center">
                <div class="opacity-50">Charts:</div>
                <select class="bg-zinc-300 dark:bg-calypso-900 p-2">
                    <option value="mobula">Mobula</option>
                    <option value="rakku">Rakku</option>
                </select>
            </div> -->
        </div>

        <div class="flex flex-col gap-2 dark:bg-calypso-900 p-4">
            <div class="underline">Wallet Management</div>
            <div class="flex flex-col w-full">
                <div @click="openModal">Add Verified Wallets</div>

                <AlephiumConnect v-slot="{ disconnect, isConnected }">
                    <div class="flex flex-col md:flex-row gap-4">
                        <button class="px-4 py-2 rounded bg-calypso-800  transition" :disabled="isConnected"
                            :class="isConnected ? 'cursor-not-allowed opacity-50' : 'hover:bg-calypso-700'"
                            @click="openModal">
                            Connect
                        </button>

                        <button class="px-4 py-2 rounded bg-calypso-800 transition"
                            :disabled="!isConnected || activeAccountIsVerified"
                            :class="!isConnected || activeAccountIsVerified ? 'cursor-not-allowed opacity-50' : 'hover:bg-calypso-700 '"
                            @click="signWallet">Verify</button>
                        <button class="px-4 py-2 rounded bg-calypso-800 transition" :disabled="!isConnected"
                            :class="!isConnected ? 'cursor-not-allowed opacity-50' : 'hover:bg-calypso-700 '"
                            @click="disconnect">Disconnect</button>
                    </div>
                </AlephiumConnect>
            </div>

            <div class="flex flex-col gap-4 w-full">
                <div>Add <span class="italic -mb-2">Watch-Only</span> Wallet</div>
                <form @submit.prevent="saveWallet" class="flex gap-2 -mt-4 flex-col md:flex-row">
                    <input type="text" class="px-4 py-2 bg-calypso-700 md:w-96 rounded" v-model="inputWallet"
                        placeholder="....." />
                    <button class="px-4 py-2 rounded bg-calypso-800 hover:bg-calypso-700 transition"
                        :disabled="inputWallet.length === 0">Watch
                        Address</button>
                </form>
            </div>

            <ul class=" flex flex-col w-full">
                <li class="grid grid-cols-2 gap-2 my-4">
                    <div class="font-bold">
                        Verified Wallets:
                    </div>

                    <div class="flex gap-2 items-center justify-center md:w-64">
                        <div class="flex-1 flex items-center justify-center text-emerald-500">Verified</div>
                        <div class="flex-1 flex items-center justify-center text-sky-500">Primary</div>
                        <div class="flex-1 flex items-center justify-center text-red-700">Delete</div>
                    </div>

                </li>

                <li v-for="wallet in wallets" :key="wallet.address" class="grid grid-cols-2 gap-2">
                    <div class="flex items-center justify-start">
                        <button @click="viewWallet(wallet.address)"
                            class="hover:underline cursor-pointer hidden md:inline-flex text-left">
                            {{ truncateAddress(wallet.address) }}
                        </button>

                        <button @click="viewWallet(wallet.address)"
                            class="hover:underline cursor-pointer md:hidden text-left">
                            {{ truncateAddress(wallet.address, 16) }}
                        </button>
                    </div>

                    <div class="flex gap-2 items-center justify-center md:w-64">
                        <div class="flex-1 flex items-center justify-center">
                            <CheckBadgeIcon class="w-8 h-8 text-emerald-500" v-if="wallet.verified" />
                            <ExclamationCircleIcon class="w-8 h-8 text-orange-400" v-else />
                        </div>

                        <div class="flex-1 flex items-center justify-center">
                            <label class="relative flex items-center rounded-full cursor-pointer"
                                v-if="wallet.verified">
                                <input name="color" type="radio" :value="wallet.address"
                                    :checked="tipBotAddress === wallet.address"
                                    @input="setTipBotAddress(wallet.address)"
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
                            <button @click="deleteSelectedWallet(wallet.address)">
                                <TrashIcon class="w-8 h-8 text-red-700" />
                            </button>
                        </div>
                    </div>
                </li>
            </ul>
        </div>

        <details v-if="false">
            <summary>Developer Settings</summary>
            <ApiKeyManagement />
        </details>

        <div>
            <button class="bg-red-700 px-4 py-2 rounded" @click="signOutOfDiscord">
                Log Out of Discord
            </button>
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

                            <AlephiumConnect v-slot="{ connectExtension, connectDesktop, connectWalletConnect }">
                                <div class="mt-4 flex gap-2">
                                    <button type="button"
                                        class="inline-flex justify-center rounded-md border border-transparent dark:bg-calypso-600 px-4 py-2 text-sm font-bold transition dark:text-calypso-300 dark:hover:text-calypso-200 dark:hover:bg-calypso-700"
                                        @click="connectExtension">
                                        Extension
                                    </button>
                                    <button type="button"
                                        class="inline-flex justify-center rounded-md border border-transparent dark:bg-calypso-600 px-4 py-2 text-sm font-bold transition dark:text-calypso-300 dark:hover:text-calypso-200 dark:hover:bg-calypso-700"
                                        @click="connectWalletConnect">
                                        Wallet Connect
                                    </button>
                                    <button type="button"
                                        class="inline-flex justify-center rounded-md border border-transparent dark:bg-calypso-600 px-4 py-2 text-sm font-bold transition dark:text-calypso-300 dark:hover:text-calypso-200 dark:hover:bg-calypso-700"
                                        @click="connectDesktop">
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
