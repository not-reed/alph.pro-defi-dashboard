<script setup lang="ts">
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline';
import { computed, onMounted, ref } from 'vue';
import ProxyImage from '../../components/ProxyImage.vue';
import ExternalLink from '../../components/ExternalLink.vue';
const holders = ref([])
const active = ref(null)

onMounted(async () => {
    const results = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/nfts/holders`, { credentials: 'include' }).then(a => a.json())
    holders.value = results.holders

    await loadActive(holders.value[0]?.address)
})

async function loadActive(address: string) {
    const results2 = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/nfts/holders/${address}`, { credentials: 'include' }).then(a => a.json())
    active.value = results2.holders[0]
}

const activeHolders = computed(() => Array.from(active?.value.holders.reduce((acc, cur) => {
    const holder = acc.get(cur.userAddress) || { userAddress: cur.userAddress, balance: 0 }
    holder.balance += 1
    acc.set(cur.userAddress, holder)
    return acc
}, new Map()).values()).sort((a, b) => b.balance - a.balance))
</script>

<template>
    <div class="p-4 flex gap-4">
        <ul class="max-w-xs w-full grid flex-wrap">
            <li v-for="holder in holders" class="grid grid-cols-3 gap-2 hover:dark:bg-calypso-800 rounded"
                @click="loadActive(holder.address)">
                <div class="w-1/2">
                    {{ holder.name }}
                </div>
                <div>
                    {{ holder.stats.holderCount }} Holders
                    {{ holder.stats.listedCount }} Listed
                    {{ holder.stats.mintedCount }} Minted
                </div>

                <ProxyImage :src="holder.image" :width="300" :height="300" class="w-24 h-full object-cover" />
            </li>
        </ul>
        <div class="flex flex-col flex-grow gap-4" v-if="active">
            <div class="flex flex-col  dark:bg-calypso-900 p-4 rounded max-w-72">
                <div class=" flex justify-between">

                    <div class="opacity-75">Name:</div> {{ active.name }}
                </div>

                <div class="flex justify-between">
                    <div class="opacity-75">Holders:</div> {{ active.holderCount }}
                </div>
                <div class="flex flex-col items-start">
                    <ExternalLink :href="`https://explorer.alephium.org/addresses/${active.address}`" class="">
                        Explorer
                    </ExternalLink>

                    <ExternalLink :href="`https://deadrare.io/collection-from-contract/${active.address}`" class="">
                        DeadRare
                    </ExternalLink>
                </div>
            </div>
            <ul class="h-96 overflow-y-auto dark:bg-calypso-900 p-4 rounded max-w-lg">
                <li v-for="holder in activeHolders" class="flex">

                    <RouterLink :to="`/portfolio/overview/${holder.userAddress}`"
                        class="text-calypso-500 cursor-pointer w-56">
                        {{ holder.userAddress.slice(0, 4) }}...{{ holder.userAddress.slice(-4) }}
                    </RouterLink>

                    <div>
                        {{ holder.balance }} Tokens
                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>
