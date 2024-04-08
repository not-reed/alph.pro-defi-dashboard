<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import ProxyImage from '../../components/ProxyImage.vue';
import ExternalLink from '../../components/ExternalLink.vue';
import { bs58 } from '@alephium/web3';
const holders = ref([])
const active = ref(null)

onMounted(async () => {
    const results = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/nfts/holders`, { credentials: 'include' }).then(a => a.json())
    holders.value = results.holders

    await loadActive(holders.value[0]?.address)
})

async function loadActive(address: string) {
    const results2 = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/nfts/holders/${address}`, { credentials: 'include' }).then(a => a.json())
    active.value = {
        address: results2.holders[0].address,
        circulatingSupply: results2.holders[0].circulatingSupply,
        description: results2.holders[0].description,
        holderCount: results2.holders[0].holderCount,
        id: results2.holders[0].id,
        image: results2.holders[0].image,
        name: results2.holders[0].name,
        social: results2.holders[0].social,
        uri: results2.holders[0].uri,
        holders: results2.holders[0].holders,
    }
    console.log({ results2 })
}

const activeHolders = computed(() => Array.from(active?.value.holders.reduce((acc, cur) => {
    const holder = acc.get(cur.userAddress) || { userAddress: cur.userAddress, balance: 0, isContract: bs58.decode(cur.userAddress)[0] === 0x03 }
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
                    {{ holder.stats.holderCount }} Owners
                    {{ holder.stats.listedCount }} Listed
                    {{ holder.stats.mintedCount }} Minted
                </div>

                <ProxyImage :src="holder.image" :width="300" :height="300" class="w-24 h-full object-cover" />
            </li>
        </ul>
        <div class="flex flex-col flex-grow gap-4" v-if="active">
            <div class="flex gap-4 dark:bg-calypso-900 p-4 rounded w-max">
                <div class="flex flex-col ">
                    <div class=" flex gap-2 justify-between">
                        <div class="opacity-75">Name:</div> {{ active.name }}
                    </div>


                    <div class="flex gap-2 justify-between">
                        <div class="opacity-75">Addresses:</div> {{ active.holderCount }}
                    </div>
                    <!-- <div class="flex justify-between">
                        <div class="opacity-75">Listed:</div> {{ active.listedCount }}
                    </div>
                    <div class="flex justify-between">
                        <div class="opacity-75">Minted:</div> {{ active.mintedCount }}
                    </div> -->
                    <div class="flex flex-col items-start">
                        <ExternalLink :href="`https://explorer.alephium.org/addresses/${active.address}`" class="">
                            Explorer
                        </ExternalLink>

                        <ExternalLink :href="`https://deadrare.io/collection-from-contract/${active.address}`" class="">
                            DeadRare
                        </ExternalLink>
                    </div>
                </div>
                <div class="flex">
                    <ProxyImage :src="active.image" :width="300" :height="300" class="w-36 h-36 object-cover" />
                </div>
            </div>
            <div class="h-96 overflow-y-auto bg-zinc-200 dark:bg-calypso-900 p-4 rounded max-w-lg">
                <table class="w-full">
                    <tbody>
                        <tr v-for="holder in activeHolders" class="">

                            <td class="">
                                {{ holder.balance }} Tokens
                            </td>

                            <td>
                                {{ Math.round(holder.balance / active.circulatingSupply * 10000) / 100 }}%
                            </td>

                            <td>
                                <RouterLink :to="`/portfolio/overview/${holder.userAddress}`"
                                    class="text-calypso-500 cursor-pointer  flex items-center justify-start">
                                    <span class="w-28">{{ holder.userAddress.slice(0, 4) }}...{{
                holder.userAddress.slice(-4) }}</span>
                                    <span v-if="holder.isContract"
                                        class="bg-calypso-800 text-xs px-1 py-px flex items-center justify-center w-14 rounded-lg">Contract</span>
                                </RouterLink>
                            </td>

                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
