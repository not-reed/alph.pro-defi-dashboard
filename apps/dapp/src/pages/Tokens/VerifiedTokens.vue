<script setup lang="ts">
import { ArrowDownIcon, QuestionMarkCircleIcon } from '@heroicons/vue/24/outline';
import { computed, onMounted, ref } from 'vue';
import ExternalLink from '../../components/ExternalLink.vue';
import { useCurrency } from '../../hooks/useCurrency';
import { usePrices } from '../../hooks/usePrices';
import Table from '../../components/table/Table.vue'
import TableBody from '../../components/table/TableBody.vue'
import TableHead from '../../components/table/TableHead.vue'
import TableRow from '../../components/table/TableRow.vue'
import TableHeader from '../../components/table/TableHeader.vue'
import TableCell from '../../components/table/TableCell.vue'
import ProxyImage from '../../components/ProxyImage.vue'

interface TokenHolder {
    holderCount: bigint,
    marketCap: number
    liquidity: number
    price: number
    circulatingSupply: bigint,
    token: {
        id: string,
        address: string,
        symbol: string,
        name: string,
        decimals: number,
        totalSupply: number,
        listed: boolean,
        description: string | null,
        logo: string | null
    }
}

enum SortBy {
    Name = 'Name',
    Symbol = 'Symbol',
    Price = 'Price',
    Decimals = 'Decimals',
    Explorer = 'Explorer',
    Holders = 'Holders',
    MarketCap = 'MarketCap',
    Liquidity = 'Liquidity'
}
enum SortDirection {
    Asc = 'Asc',
    Desc = 'Desc'
}

const { format: formatCurrency } = useCurrency()
const { prices, markets, updatePrices } = usePrices()

const rawTokens = ref<Omit<TokenHolder, 'marketCap' | 'liquidity'>[]>([])
onMounted(async () => {
    const results: { holders: TokenHolder[] } = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/tokens/holders`, { credentials: 'include' }).then(a => a.json())
    updatePrices(results.holders.filter(a => a.token.listed).map(a => a.token.address))
    rawTokens.value = results.holders
})

const DEFAULT_SORT_BY =  localStorage.getItem("tokens:sortBy") as SortBy
const DEFAULT_SORT_DIRECTION = localStorage.getItem("tokens:sortDirections") as SortDirection
const sortBy = ref<SortBy>(DEFAULT_SORT_BY || SortBy.Holders)
const sortDirection = ref<SortDirection>(DEFAULT_SORT_DIRECTION || SortDirection.Desc)

function getSortValue(holder: TokenHolder) {
    switch (sortBy.value) {
        case SortBy.Name:
            return holder.token.name.toLowerCase()
        case SortBy.Symbol:
            return holder.token.symbol.toLowerCase()
        case SortBy.Decimals:
            return holder.token.decimals
        case SortBy.Price:
            return holder.price
        case SortBy.Holders:
            return holder.holderCount
        case SortBy.Explorer:
            return holder.token.address.toLowerCase()
        case SortBy.MarketCap:
            return holder.marketCap
        case SortBy.Liquidity:
            return holder.liquidity
    }
}

const tokens = computed(() => rawTokens.value.map((holder) => {
    const circulatingSupply = BigInt(holder.circulatingSupply)
    const marketCap = prices[holder.token.address]
        ? (Number(circulatingSupply) / 10 ** (holder.token.decimals)) * prices[holder.token.address]
        : 0
    const liquidity = markets[holder.token.address]?.length
        ? markets[holder.token.address].reduce((acc, cur) => {
            return acc + BigInt(cur.liquidity || '0')
        }, 0n)
        : 0n
    return {
        holderCount: BigInt(holder.holderCount),
        marketCap: marketCap,
        liquidity: Number(liquidity) / 1e18,
        price: prices[holder.token.address] || 0,
        circulatingSupply,
        token: holder.token
    }
}).filter(a => a.token.listed).sort((a, b) => {
    const aSort = getSortValue(a)
    const bSort = getSortValue(b)
    if (aSort === bSort) {
        return 0
    }
    if (aSort > bSort) {
        return sortDirection.value === SortDirection.Asc ? 1 : -1
    }
    return sortDirection.value === SortDirection.Asc ? -1 : 1

}))

function sortByField(e: any) {
    const sort = e.target.value as SortBy
    sortBy.value = sort
    localStorage.setItem("tokens:sortBy", sortBy.value)
}

function sortDirectionField(e: any) {
    const direction = e.target.value as SortDirection
    sortDirection.value = direction
    localStorage.setItem("tokens:sortDirections", sortDirection.value)
}
</script>
<template>
    <div class="flex flex-col gap-4 md:p-4 max-w-screen md:max-w-4xl">

        <div class="px-4 w-screen md:w-auto">
            <div class="flex flex-col md:flex-row gap-4 justify-between pt-4">
                <div class="text-xl font-bold">Listed Tokens</div>

                <div class="flex gap-4 flex-col md:flex-row">
                    <div class="flex items-center justify-between gap-2">
                        <div>Sort Direction:</div>
                        <select v-model="sortDirection" class="bg-zinc-300 dark:bg-calypso-900 p-2"
                            @input="sortDirectionField">
                            <option v-for="option in Object.values(SortDirection)" :value="option">{{ option }}</option>
                        </select>
                    </div>
                    <div class="flex items-center justify-between gap-2">
                        <div>Sort by:</div>
                        <select v-model="sortBy" class="bg-zinc-300 dark:bg-calypso-900 p-2" @input="sortByField">
                            <option v-for="option in Object.values(SortBy)" :value="option">{{ option }}</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <Table class="w-full">
            <TableHead class=" sticky -top-px md:top-10">
                <TableRow>
                    <TableHeader>&nbsp;</TableHeader>
                    <TableHeader class="cursor-pointer">
                        <span class="flex items-center gap-2 justify-center text-center">
                            Token
                        </span>
                    </TableHeader>
                    <TableHeader class="cursor-pointer">
                        <span class="flex items-center gap-2">
                            Holders
                            <ArrowDownIcon class="w-4 h-4 transition hidden md:inline-flex"
                                v-if="sortBy === SortBy.Holders"
                                :class="sortDirection === SortDirection.Asc ? 'rotate-0' : 'rotate-180'" />
                            <span class="w-4 h-4" v-else>&nbsp;</span>
                        </span>
                    </TableHeader>

                    <TableHeader class="cursor-pointer">
                        <span class="flex items-center gap-2">
                            Price
                            <ArrowDownIcon class="w-4 h-4 transition hidden md:inline-flex"
                                v-if="sortBy === SortBy.Price"
                                :class="sortDirection === SortDirection.Asc ? 'rotate-0' : 'rotate-180'" />
                            <span class="w-4 h-4" v-else>&nbsp;</span>
                        </span>
                    </TableHeader>
                    <TableHeader class="cursor-pointer">
                        <span class="flex items-center justify-center whitespace-nowrap">
                            <span class="hidden md:inline-block">MarketCap</span><span class="md:hidden">MCap</span>
                            <ArrowDownIcon class="w-4 h-4 transition hidden md:inline-flex"
                                v-if="sortBy === SortBy.MarketCap"
                                :class="sortDirection === SortDirection.Asc ? 'rotate-0' : 'rotate-180'" />
                            <span v-else></span>
                            /<span class="hidden md:inline-block">Liquidity</span><span class="md:hidden">Liq</span>
                            <ArrowDownIcon class="w-4 h-4 transition hidden md:inline-flex"
                                v-if="sortBy === SortBy.Liquidity"
                                :class="sortDirection === SortDirection.Asc ? 'rotate-0' : 'rotate-180'" />
                            <span class="w-4 h-4" v-else>&nbsp;</span>
                        </span>
                    </TableHeader>

                    <TableHeader class="cursor-pointer hidden md:table-cell">
                        <span class="flex items-center gap-2">
                            Decimals
                        </span>
                    </TableHeader>
                    <TableHeader class="px-2 py-2 hidden md:table-cell">
                        <span class="flex items-center gap-2">
                            Explorer
                        </span>
                    </TableHeader>
                </TableRow>
            </TableHead>

            <TableBody>
                <TableRow v-for="(token, idx) in tokens"
                    class="odd:dark:bg-calypso-800 even:dark:bg-calypso-900 odd:dark:hover:bg-calypso-700 even:dark:hover:bg-calypso-700 bg-zinc-300 odd:bg-zinc-300 even:bg-zinc-200">
                    <TableCell class="px-px md:px-2 py-1 text-right">{{ idx + 1 }}.</TableCell>
                    <TableCell class="px-2 py-1 flex flex-col items-center max-w-16 md:max-w-32">
                        <ProxyImage :src="token.token.logo" :width="50" :height="50" class="w-6 h-6 rounded-full"
                            v-if="token.token.logo" />
                        <QuestionMarkCircleIcon class="w-6 h-6 rounded-full" v-else />
                        <div class="text-ellipsis overflow-hidden text-center max-w-16 md:max-w-32 whitespace-nowrap">
                            {{ token.token.symbol }}
                        </div>
                    </TableCell>


                    <TableCell class="px-2 py-1">{{ token.holderCount }}</TableCell>
                    <TableCell class="px-2 py-1 max-w-4 overflow-auto">
                        <template v-if="token.price">{{ formatCurrency(token.price) }}</template>
                    </TableCell>
                    <TableCell class="px-2 py-1">
                        <div class="text-calypso-700 dark:text-calypso-400">{{ formatCurrency(token.marketCap || 0) }}
                        </div>
                        <div class="">{{ formatCurrency(token.liquidity) }}</div>
                    </TableCell>
                    <TableCell class="px-2 py-1 hidden md:table-cell">{{ token.token.decimals }}</TableCell>
                    <TableCell class="px-2 py-1 hidden md:table-cell">
                        <ExternalLink :href="`https://explorer.alephium.org/addresses/${token.token.address}`">
                            {{ token.token.address.slice(0, 3) }}...{{ token.token.address.slice(-3) }}
                        </ExternalLink>
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>

    </div>
</template>
