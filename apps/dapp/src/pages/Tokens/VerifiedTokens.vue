<script setup lang="ts">
import { ArrowDownIcon } from '@heroicons/vue/24/outline';
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

const sortBy = ref<SortBy>(SortBy.Holders)
const sortDirection = ref<SortDirection>(SortDirection.Desc)

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
            console.log({ acc, cur })
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

function sortByField(sort: SortBy) {
    if (sortBy.value === sort) {
        sortDirection.value = sortDirection.value === SortDirection.Asc ? SortDirection.Desc : SortDirection.Asc
    } else {
        sortBy.value = sort
        sortDirection.value = SortDirection.Desc
    }
}
</script>
<template>
    <div class="flex flex-col gap-8 p-4 max-w-4xl">
        <div>

            <div class="text-xl font-bold">
                Listed Tokens
            </div>
            <Table>

                <TableHead>
                    <TableRow>
                        <TableHeader @click="sortByField(SortBy.Name)">&nbsp;</TableHeader>
                        <TableHeader @click="sortByField(SortBy.Name)">&nbsp;</TableHeader>
                        <TableHeader @click="sortByField(SortBy.Name)" class="cursor-pointer hidden md:table-cell">
                            <span class="flex items-center gap-2">
                                Name
                                <ArrowDownIcon class="w-4 h-4 transition" v-if="sortBy === SortBy.Name"
                                    :class="sortDirection === SortDirection.Asc ? 'rotate-0' : 'rotate-180'" />
                                <span class="w-4 h-4" v-else>&nbsp;</span>
                            </span>
                        </TableHeader>
                        <TableHeader @click="sortByField(SortBy.Symbol)" class="cursor-pointer">
                            <span class="flex items-center gap-2">
                                Symbol
                                <ArrowDownIcon class="w-4 h-4 transition" v-if="sortBy === SortBy.Symbol"
                                    :class="sortDirection === SortDirection.Asc ? 'rotate-0' : 'rotate-180'" />
                                <span class="w-4 h-4" v-else>&nbsp;</span>
                            </span>
                        </TableHeader>
                        <TableHeader @click="sortByField(SortBy.Decimals)" class="cursor-pointer hidden md:table-cell">
                            <span class="flex items-center gap-2">
                                Decimals
                                <ArrowDownIcon class="w-4 h-4 transition" v-if="sortBy === SortBy.Decimals"
                                    :class="sortDirection === SortDirection.Asc ? 'rotate-0' : 'rotate-180'" />
                                <span class="w-4 h-4" v-else>&nbsp;</span>
                            </span>
                        </TableHeader>
                        <TableHeader @click="sortByField(SortBy.Explorer)" class="px-2 py-2 hidden md:table-cell">
                            <span class="flex items-center gap-2">
                                Explorer
                                <ArrowDownIcon class="w-4 h-4 transition" v-if="sortBy === SortBy.Explorer"
                                    :class="sortDirection === SortDirection.Asc ? 'rotate-0' : 'rotate-180'" />
                                <span class="w-4 h-4" v-else>&nbsp;</span>
                            </span>
                        </TableHeader>
                        <TableHeader @click="sortByField(SortBy.Holders)" class="cursor-pointer">
                            <span class="flex items-center gap-2">
                                Holders
                                <ArrowDownIcon class="w-4 h-4 transition" v-if="sortBy === SortBy.Holders"
                                    :class="sortDirection === SortDirection.Asc ? 'rotate-0' : 'rotate-180'" />
                                <span class="w-4 h-4" v-else>&nbsp;</span>
                            </span>
                        </TableHeader>
                        <TableHeader @click="sortByField(SortBy.MarketCap)" class="cursor-pointer">
                            <span class="flex items-center gap-2">
                                MarketCap
                                <ArrowDownIcon class="w-4 h-4 transition" v-if="sortBy === SortBy.MarketCap"
                                    :class="sortDirection === SortDirection.Asc ? 'rotate-0' : 'rotate-180'" />
                                <span class="w-4 h-4" v-else>&nbsp;</span>
                            </span>
                        </TableHeader>
                        <TableHeader @click="sortByField(SortBy.Liquidity)" class="cursor-pointer">
                            <span class="flex items-center gap-2">
                                Liquidity
                                <ArrowDownIcon class="w-4 h-4 transition" v-if="sortBy === SortBy.Liquidity"
                                    :class="sortDirection === SortDirection.Asc ? 'rotate-0' : 'rotate-180'" />
                                <span class="w-4 h-4" v-else>&nbsp;</span>
                            </span>
                        </TableHeader>
                        <TableHeader @click="sortByField(SortBy.Price)" class="cursor-pointer">
                            <span class="flex items-center gap-2">
                                Price
                                <ArrowDownIcon class="w-4 h-4 transition" v-if="sortBy === SortBy.Price"
                                    :class="sortDirection === SortDirection.Asc ? 'rotate-0' : 'rotate-180'" />
                                <span class="w-4 h-4" v-else>&nbsp;</span>
                            </span>
                        </TableHeader>
                    </TableRow>
                </TableHead>



                <TableBody>
                    <TableRow v-for="(token, idx) in tokens"
                        class="odd:dark:bg-calypso-800 even:dark:bg-calypso-900 odd:dark:hover:bg-calypso-700 even:dark:hover:bg-calypso-700 bg-zinc-300 odd:bg-zinc-300 even:bg-zinc-200">
                        <TableCell class="px-2 py-1 text-right">{{ idx + 1 }}.</TableCell>
                        <TableCell class="px-2 py-1 min-w-10">
                            <ProxyImage :src="token.token.logo" :width="50" :height="50" class="w-6 h-6 rounded-full"
                                v-if="token.token.logo" />
                            <QuestionMarkCircleIcon class="w-6 h-6 rounded-full" v-else />
                        </TableCell>
                        <TableCell class="px-2 py-1 truncate max-w-36 hidden md:table-cell">{{ token.token.name }}
                        </TableCell>
                        <TableCell class="px-2 py-1 hidden md:table-cell">
                            {{ token.token.symbol }}
                        </TableCell>
                        <TableCell class="px-2 py-1 table-cell md:hidden">
                            <ExternalLink :href="`https://explorer.alephium.org/addresses/${token.token.address}`"
                                class="">
                                <span class="w-14 text-ellipsis overflow-hidden">
                                    {{ token.token.symbol }}
                                </span>
                            </ExternalLink>
                        </TableCell>
                        <TableCell class="px-2 py-1 hidden md:table-cell">{{ token.token.decimals }}</TableCell>
                        <TableCell class="px-2 py-1 hidden md:table-cell">
                            <ExternalLink :href="`https://explorer.alephium.org/addresses/${token.token.address}`">
                                {{ token.token.address.slice(0, 4) }}...{{ token.token.address.slice(-4) }}
                            </ExternalLink>
                        </TableCell>
                        <TableCell class="px-2 py-1">{{ token.holderCount }}</TableCell>
                        <TableCell class="px-2 py-1">
                            <template v-if="token.marketCap">
                                {{ formatCurrency(token.marketCap) }}
                            </template>
                        </TableCell>
                        <TableCell class="px-2 py-1">
                            <template v-if="token.liquidity">
                                {{ formatCurrency(token.liquidity) }}
                            </template>
                        </TableCell>
                        <TableCell class="px-2 py-1">
                            <template v-if="token.price">
                                {{ formatCurrency(token.price) }}
                            </template>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    </div>
</template>
