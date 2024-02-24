<script setup lang="ts">
import { CheckBadgeIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { ExclamationCircleIcon } from '@heroicons/vue/24/solid';
import nProgress from 'nprogress';
import { onMounted, ref } from 'vue';
import { useUser } from '../hooks/useUser';
import { useRouter } from 'vue-router';
// import { useModals } from '../hooks/useModals';


const { setWallet } = useUser()
const router = useRouter()
// const { pushModal } = useModals()
const wallets = ref<{ address: string, verified: boolean }[]>([])
async function refreshWallets() {
    const response: any = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/wallets`, { credentials: 'include' }).then(a => a.json())
    wallets.value = response.wallets
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
</script>
<template>
    <div class="p-6 flex flex-col gap-9 items-center">
        <div class="flex flex-col gap-4">
            <div>Watch Wallet</div>
            <form @submit.prevent="saveWallet" class="flex gap-2">
                <input type="text" class="px-4 py-2 bg-calypso-700 w-96" v-model="inputWallet" />
                <button class="border px-4 py-2 rounded">Watch</button>
            </form>
        </div>
        <div class="flex justify-center items-center">
            <div class="flex gap-4">
                <button class="border px-4 py-2 rounded opacity-50" disabled>Connect Wallet</button>
                <!-- <button class=" border px-4 py-2 rounded opacity-50" disabled>Verify Wallet</button> -->
            </div>
        </div>
        <div>
            <div class="font-bold text-xl">
                Wallets:
            </div>
            <ul>
                <li v-for="wallet in wallets" :key="wallet.address" class="flex items-center justify-between gap-2 w-full">
                    <div @click="viewWallet(wallet.address)">
                        {{ wallet.address.slice(0, 15) }}...{{ wallet.address.slice(-15) }}
                    </div>

                    <div class="flex gap-2">
                        <CheckBadgeIcon class="w-8 h-8 text-emerald-500" v-if="!wallet.verified" />
                        <ExclamationCircleIcon class="w-8 h-8 text-orange-400" v-else />


                        <TrashIcon class="w-8 h-8 text-red-700" @click="deleteWallet(wallet.address)" />
                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>
