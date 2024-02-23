<script setup lang=ts>
import { ref } from 'vue';
import { useUser } from '../hooks/useUser'
import { useRouter } from 'vue-router';

const { user, setWallet } = useUser()
const wallet = ref(user.wallet)

const router = useRouter()
function viewWallet() {
    setWallet(wallet.value)
    router.push('/portfolio/overview')
}
</script>
<template>
    <div class="flex flex-col gap-8 items-center justify-center h-full">

        <!-- <img src="../assets/logo.svg" /> -->
        <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" viewBox="0 0 82.2 93.2"
            class="w-32 h-32 text-calypso-200">
            <path fill="currentColor" d="M0 93.2 41 0l41.2 93.1H27.6l6.2-14 28.2.1-21-47.8-27.2 61.8z" />
        </svg>

        <form @submit.prevent class="flex flex-col w-full gap-8 max-w-xl">

            <input autofocus type="text" v-model="wallet" placeholder="1CHYuhea7uaupotv2KkSwNLaJWYeNouDp4QffhkhTxKpr"
                class="scale-95 focus:scale-100 hover:scale-100 transition text-emerald-200 px-4 py-2 rounded bg-calypso-900 shadow-xl text-xl placeholder-calypso-500 placeholder-opacity-25" />

            <div class="flex items-center gap-8 justify-center">
                <button class="w-36 scale-95 transition px-4 py-2 bg-calypso-800 rounded text-xl shadow-xl text-emerald-200"
                    type="submit" @click="viewWallet"
                    :class="wallet.length ? 'text-opacity-100 focus:scale-100 hover:scale-100' : 'text-opacity-25'">
                    View
                </button>
                <button class="w-36 scale-95 transition px-4 py-2 bg-calypso-800 rounded text-xl shadow-xl text-emerald-200"
                    :class="wallet.length ? 'text-opacity-25' : 'text-opacity-100 focus:scale-100 hover:scale-100'">
                    Connect
                </button>
                <!-- <button class="w-36 scale-95 transition px-4 py-2 bg-calypso-800 rounded text-xl shadow-xl text-emerald-200"
                    :class="wallet.length ? 'text-opacity-25' : 'text-opacity-100 focus:scale-100 hover:scale-100'">
                    Discord
                </button> -->
            </div>
        </form>
    </div>
</template>
