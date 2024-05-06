<script setup lang="ts">
import { ref } from 'vue';
import { useUser } from '../hooks/useUser'
import { useRouter } from 'vue-router';
import { useDiscordAccount } from '../hooks/useDiscordAccount';
import ConnectModal from '../components/ConnectModal.vue';
import {  useAccount, useConnect } from '@alphpro/web3-vue'


const { user, setWallet } = useUser()
const { account } = useAccount()
const { session, signIn, wallets, refreshWallets } = useDiscordAccount()
const router = useRouter()
const wallet = ref(user.wallet)

const { onConnect } = useConnect()

onConnect(() => {
    router.push(`/portfolio/overview/${account.address}`)
})




async function signInWithDiscord() {
    await signIn()
    await refreshWallets()
    const defaultWallet = wallets.value.find(w => w.isTipBot) || wallets.value[0]
    if (defaultWallet && !account.address) {
      setWallet(defaultWallet.address)
      router.push(`/portfolio/overview/${defaultWallet.address}`)
    }
}


function viewWallet() {
    setWallet(wallet.value)
    router.push(`/portfolio/overview/${wallet.value}`)
}


function closeModal() {
    isOpen.value = false
}
function openModal() {
    isOpen.value = true
}

const isOpen = ref(false)
</script>

<template>
    <div class="flex flex-col gap-8 items-center justify-center max-w-2xl grow">

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

                <button :disabled="Boolean(session.user.name)" @click="signInWithDiscord"
                    :class="session.user.name ? 'opacity-50 cursor-not-allowed' : 'opacity-100 focus:scale-100 hover:scale-100'"
                    class="w-full md:w-36 scale-95 transition px-4 py-2 bg-zinc-200 dark:bg-calypso-800 rounded text-xl shadow-xl text-zinc-600 dark:text-emerald-200">
                    Discord
                </button>
            </div>
        </form>
    </div>

    <ConnectModal :open="isOpen" @close="closeModal" />
</template>
