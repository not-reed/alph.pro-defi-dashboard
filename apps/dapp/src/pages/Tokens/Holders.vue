<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
const holders = ref([])
const active = ref(null)

onMounted(async () => {
    const results = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/tokens/holders`, { credentials: 'include' }).then(a => a.json())
    holders.value = results.holders

    await loadActive(holders.value[0]?.token?.address)
})

async function loadActive(address: string) {
    const results2 = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/tokens/holders/${address}`, { credentials: 'include' }).then(a => a.json())
    active.value = results2.holders[0]
}

const verified = computed(() => holders.value.filter((holder: any) => holder.token?.verified))
</script>

<template>
    <div class="p-4 flex gap-4">
        <ul class="max-w-xs w-full">
            <li v-for="holder in verified" class="flex gap-2 hover:dark:bg-calypso-800 rounded"
                @click="loadActive(holder.token.address)">
                <div class="w-1/3">
                    {{ holder.token.symbol }}
                </div>
                <div>

                    {{ holder.holderCount }} Holders
                </div>
            </li>
        </ul>
        <div class="flex flex-col flex-grow gap-4" v-if="active">
            <div class="flex flex-col  dark:bg-calypso-900 p-4 rounded max-w-72">
                <div class=" flex justify-between">

                    <div class="opacity-75">Name:</div> {{ active.token.name }}
                </div>
                <div class="flex justify-between">

                    <div class="opacity-75">Symbol:</div> {{ active.token.symbol }}
                </div>
                <div class="flex justify-between">
                    <div class="opacity-75">Decimals:</div> {{ active.token.decimals }}
                </div>
                <div class="flex justify-between">
                    <div class="opacity-75">Holders:</div> {{ active.holderCount }}
                </div>
            </div>
            <ul class="h-96 overflow-y-auto dark:bg-calypso-900 p-4 rounded">
                <li v-for="holder in active.holders" class="flex">
                    <div class="w-1/2">
                        {{ Math.round(Number(holder.balance) / 10 ** Number(active.token.decimals)) }}
                    </div>
                    <div class="">
                        <a :href="`https://explorer.alephium.org/addresses/${holder.userAddress}`" target="_blank"
                            class="text-calypso-500 cursor-pointer">
                            {{ holder.userAddress.slice(0, 4) }}...{{ holder.userAddress.slice(-4) }}
                        </a>
                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>
