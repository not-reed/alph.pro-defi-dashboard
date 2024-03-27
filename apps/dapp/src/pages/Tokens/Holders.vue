<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'
import { usePrices } from '../../hooks/usePrices';
import { useCurrency } from '../../hooks/useCurrency';
import { useRoute } from 'vue-router';
import { onBeforeRouteUpdate } from 'vue-router';
import ProxyImage from '../../components/ProxyImage.vue';
const holders = ref([])
const active = ref(null)
const { prices, markets, updatePrices } = usePrices()
const { format: formatCurrency } = useCurrency()
const route = useRoute()

onMounted(async () => {
    const results = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/tokens/holders`, { credentials: 'include' }).then(a => a.json())
    holders.value = results.holders
    const active = route.params.address && !route.params.address.startsWith(':') ? Array.isArray(route.params.address) ? route.params.address[0] : route.params.address : holders.value[0]?.token?.address
    await loadActive(active)
})

onBeforeRouteUpdate(async (to, from) => {
    if (to.params.address !== from.params.address) {
        await loadActive(to.params.address)
    }
})

async function loadActive(address = route.params.address) {
    const results2 = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/tokens/holders/${address}`, { credentials: 'include' }).then(a => a.json())
    updatePrices([results2.holders[0].token.address])
    active.value = results2.holders[0]
}

const verified = computed(() => holders.value.filter((holder: any) => holder.token?.listed))
const unverified = computed(() => holders.value.filter((holder: any) => holder.token && !holder.token?.listed))

const marketCap = computed(() => {
    if (!active.value || !prices[active.value.token.address] || !active.value.circulatingSupply) {
        return 0
    }
    return prices[active.value.token.address] * (active.value.circulatingSupply / 10 ** active.value.token.decimals)
})

const liquidity = computed(() => {
    if (!active.value || !markets[active.value.token.address]) {
        return 0
    }
    return markets[active.value.token.address].reduce((acc, cur) => acc + (cur.liquidity / 1e18), 0)
})
</script>

<template>
    <div class="p-4 flex gap-4">
        <div class="w-80">
            <TabGroup>
                <TabList class="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
                    <Tab as="template" v-slot="{ selected }">
                        <button :class="[
                        'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                        'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                        selected
                            ? 'bg-white dark:bg-calypso-700 dark:text-zinc-300 text-blue-700 shadow'
                            : 'text-blue-100 hover:bg-white/[0.12] hover:text-white',
                    ]">
                            Listed
                        </button>
                    </Tab>
                    <Tab as="template" v-slot="{ selected }">
                        <button :class="[
                        'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                        'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                        selected
                            ? 'bg-white dark:bg-calypso-700 dark:text-zinc-300 text-blue-700 shadow'
                            : 'text-blue-100 hover:bg-white/[0.12] hover:text-white',
                    ]">
                            Unlisted
                        </button>
                    </Tab>
                </TabList>
                <TabPanels class="mt-2">
                    <TabPanel :class="[
                        'rounded-xl bg-white dark:bg-calypso-900 p-3',
                        'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                    ]">
                        <ul class="max-w-xs w-full">
                            <RouterLink v-for="holder in verified"
                                class="flex gap-2 hover:bg-zinc-200 hover:dark:bg-calypso-800 rounded"
                                :to="`/tokens/holders/${holder.token.address}`">
                                <div class="w-1/3">
                                    {{ holder.token.symbol }}
                                </div>
                                <div>
                                    {{ holder.holderCount }} Holders
                                </div>
                            </RouterLink>
                        </ul>
                    </TabPanel>
                    <TabPanel :class="[
                        'rounded-xl bg-white dark:bg-calypso-900 p-3',
                        'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                    ]">
                        <ul class="max-w-xs w-full">
                            <RouterLink v-for="holder in unverified"
                                class="flex gap-2 hover:bg-zinc-200 hover:dark:bg-calypso-800 rounded"
                                :to="`/tokens/holders/${holder.token.address}`">
                                <div class="w-1/3">
                                    {{ holder.token.symbol }}
                                </div>
                                <div>
                                    {{ holder.holderCount }} Holders
                                </div>
                            </RouterLink>
                        </ul>
                    </TabPanel>
                </TabPanels>
            </TabGroup>
        </div>

        <div class="flex flex-col flex-grow gap-4" v-if="active">
            <div class="flex justify-between bg-zinc-200 dark:bg-calypso-900 p-4 rounded max-w-96">
                <div class="flex flex-col w-full min-w-72">
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
                    <div class="flex justify-between">
                        <div class="opacity-75">Marketcap:</div> {{ formatCurrency(marketCap) }}
                    </div>
                    <div class="flex justify-between">
                        <div class="opacity-75">Ayin Liquidity:</div> {{ formatCurrency(liquidity) }}
                    </div>
                </div>
                <div class="flex items-center justify-center w-full">
                    <ProxyImage :src="active.token.logo" :width="64" :height="64"
                        class="object-contain w-16 h-16 relative left-2" />
                </div>
            </div>

            <ul class="h-96 overflow-y-auto bg-zinc-200 dark:bg-calypso-900 p-4 rounded max-w-lg">
                <li v-for="holder in active.holders" class="grid grid-cols-5 gap-4">
                    <div class="col-span-2">
                        {{ Math.round(Number(holder.balance) / 10 ** Number(active.token.decimals)) }}
                    </div>

                    <div>
                        {{ Math.round(holder.balance / active.circulatingSupply * 10000) / 100 }}%
                    </div>

                    <div class="col-span-2">
                        <RouterLink :to="`/portfolio/overview/${holder.userAddress}`"
                            class="text-calypso-500 cursor-pointer">
                            {{ holder.userAddress.slice(0, 4) }}...{{ holder.userAddress.slice(-4) }}
                        </RouterLink>
                        <!-- <a :href="`https://explorer.alephium.org/addresses/${holder.userAddress}`" target="_blank"
                            class="text-calypso-500 cursor-pointer">
                            {{ holder.userAddress.slice(0, 4) }}...{{ holder.userAddress.slice(-4) }}
                        </a> -->
                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>
