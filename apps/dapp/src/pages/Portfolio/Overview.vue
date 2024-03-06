<script setup lang="ts">
import { computed } from 'vue';
import Icon from '../../components/Icon.vue';
import { useUser } from '../../hooks/useUser';
import { usePrices } from '../../hooks/usePrices';
import { useCurrency } from '../../hooks/useCurrency';
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline';
import ExternalLink from '../../components/ExternalLink.vue';
import { truncateAddress } from '../../utils/addresses';
import { useRoute } from 'vue-router';

const { user } = useUser()
const { currency, format } = useCurrency()
const route = useRoute()

const { prices } = usePrices()


interface PartialToken {
    token: {
        address: string
        symbol: string
        logo: string
        verified: boolean
    }
    balance: number
    price: number
}

const pricedTokens = computed(() => user.balances.reduce((acc, balance) => {
    if (!balance.token?.verified) {
        return acc;
    }

    return acc.concat({
        ...balance,
        balance: balance.balance / 10 ** balance.token.decimals,
        price: prices[balance.token.address],
    })
}, [] as PartialToken[]).sort((a: PartialToken, b: PartialToken) => {
    const aWorth = a.balance * a.price
    const bWorth = b.balance * b.price
    if (!aWorth && bWorth) return 1
    if (aWorth && !bWorth) return -1
    if (aWorth && bWorth) return bWorth - aWorth
    return a.token.symbol.localeCompare(b.token.symbol)
}))


const nfts = computed(() => user.balances.filter(a => Boolean(a.nft?.image)).sort((a, b) => a.nft?.name.localeCompare(b.nft?.name)))

const tokenWorth = computed(() => {
    return pricedTokens.value.reduce((acc: number, balance: PartialToken) => {
        return acc + balance.balance * (balance.price || 0)
    }, 0)
})
const stakedWorth = 0
const nftWorth = 0
const claimableWorth = 0

const netWorth = computed(() => tokenWorth.value + stakedWorth + nftWorth + claimableWorth)

const secondaryCurrencies = computed(() => {
    const options = ['USD', 'ALPH', 'BTC', 'ETH'] as const
    return options.filter(a => a !== currency.value).slice(0, 3)
})

const routeUserAddress = route.params.address as string
</script>

<template>
    <div class="flex flex-col w-full max-w-2xl">

        <div class="grid grid-cols-4 gap-2 m-4 w-full">
            <div
                class="bg-zinc-200 dark:bg-calypso-900 shadow-xl col-span-2 row-span-2 rounded p-2 flex flex-col justify-between border-b border-b-calypso-800">
                <span class="text-calypso-800 dark:text-calypso-300 text-sm opacity-75">Net Worth</span>
                <span class="text-2xl font-bold  text-calypso-700 dark:text-calypso-500">
                    {{ format(netWorth, currency) }}
                </span>
                <span class="text-base leading-4" v-for="secondary in secondaryCurrencies">
                    {{ format(netWorth, secondary) }}
                </span>
            </div>
            <div
                class="bg-zinc-200 dark:bg-calypso-900 shadow-xl rounded p-2  flex flex-col border-b border-b-calypso-800">
                <span class="text-calypso-900 dark:text-calypso-300 text-sm opacity-75">Wallet</span>
                <span class="text-lg font-bold">{{ format(tokenWorth) }}</span>
            </div>
            <div
                class="bg-zinc-200 dark:bg-calypso-900 shadow-xl rounded p-2  flex flex-col border-b border-b-calypso-800">
                <span class="text-calypso-900 dark:text-calypso-300 text-sm opacity-75">Staked</span>
                <span class="text-lg font-bold">{{ format(stakedWorth) }}</span>
            </div>
            <div
                class="bg-zinc-200 dark:bg-calypso-900 shadow-xl rounded p-2  flex flex-col border-b border-b-calypso-800">
                <span class="text-calypso-900 dark:text-calypso-300 text-sm opacity-75">NFTs</span>
                <span class="text-lg font-bold">{{ format(nftWorth) }}</span>
            </div>
            <div
                class="bg-zinc-200 dark:bg-calypso-900 shadow-xl rounded p-2  flex flex-col border-b border-b-calypso-800">
                <span class="text-calypso-900 dark:text-calypso-300 text-sm opacity-75">Claimable</span>
                <span class="text-lg font-bold">{{ format(claimableWorth) }}</span>
            </div>
        </div>

        <div class="flex gap-2 m-4 w-full">
            <div
                class="px-4 py-2 bg-zinc-200 dark:bg-calypso-900 shadow-xl rounded flex items-center justify-between border-b border-b-calypso-800 w-full">

                <div>
                    {{ truncateAddress(routeUserAddress, 50) }}
                </div>

                <div>

                    <ExternalLink :href="`https://explorer.alephium.org/addresses/${routeUserAddress}`" class="">
                        Explorer
                    </ExternalLink>

                    <ExternalLink :href="`https://deadrare.io/account/${routeUserAddress}`" class="">
                        DeadRare
                    </ExternalLink>
                </div>
            </div>
        </div>

        <!-- TODO: only show i.e. top 10 tokens here? -->
        <ul class="grid gap-2 m-4 w-full">
            <li v-for="balance in pricedTokens"
                class="shadow dark:bg-calypso-900 bg-zinc-200 grid grid-cols-3 grid-flow-col auto-cols-min items-center justify-between gap-2 rounded-l-full pr-2">
                <div class="flex gap-2">
                    <img v-if="balance.token.logo" :src="balance.token.logo"
                        class="w-8 h-8 rounded-full dark:bg-zinc-900 bg-zinc-400" />
                    <Icon v-else name="currency" class="text-calypso-400 w-8 h-8 bg-zinc-800 rounded-full" />
                    <div>
                        <div class="text-sm -mb-1">{{ balance.token.symbol }}</div>
                        <div class="text-xs opacity-50">{{ balance.balance.toLocaleString() }}</div>
                    </div>
                </div>

                <div v-if="balance.price" class="opacity-50">{{ format(balance.price) }}</div>


                <div v-if="balance.price" class="font-bold text-calypso-700 dark:text-calypso-500">
                    {{ format(balance.price * balance.balance) }}
                </div>

            </li>
            <li v-if="false"
                class="shadow dark:bg-calypso-900 bg-zinc-200 grid grid-cols-3 grid-flow-col auto-cols-min items-center justify-between gap-2 rounded-l-full pr-2">
                <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                        stroke="currentColor" class="w-8 h-8 bg-zinc-800 rounded-full text-calypso-400">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>

                    <div class="pl-2 text-sm opacity-50">View More</div>
                </div>
            </li>
        </ul>

        <!-- TODO: Ranked by Rarest+Highest Floor -->
        <!-- Only show first 4 or 8 -->
        <ul class="grid grid-cols-4 flex-wrap gap-2 mx-4 pt-4 w-full" v-if="nfts.length">
            <li class="flex flex-col gap-1 bg-zinc-300 dark:bg-calypso-900 p-2 rounded shadow" v-for="balance in nfts">
                <img class="w-full h-32 shadow-lg object-cover rounded mb-3" :src="balance.nft.image" />
                <div class="text-sm flex items-center justify-between leading-3">
                    <div class="text-xs opacity-50">Ranked:</div>
                    <div class="font-bold">---</div>
                </div>
                <div class="text-sm flex items-center justify-between leading-3">
                    <div class="text-xs opacity-50">Floor:</div>
                    <div class="text-calypso-700 dark:text-calypso-500 font-bold">---</div>
                </div>
                <div class="text-sm flex items-center justify-between leading-3">
                    <div class="text-xs opacity-50">Listed:</div> -
                </div>

                <ExternalLink :href="`https://deadrare.io/nft/${balance.nft.address}`">
                    DeadRare
                </ExternalLink>

            </li>
        </ul>

        <ul class="m-4 pt-4 w-full flex flex-col gap-2" v-if="false">
            <li class="bg-zinc-300 dark:bg-calypso-900 max-w-2xl p-4 rounded">
                <div class="flex gap-2 items-center justify-between">
                    <img src="../../assets/ayin.png" class="w-12 h-12 position" />
                    <div class="w-1/3">
                        <div class="font-bold">ALPH-AYIN</div>
                        <div class="leading-3 text-xs opacity-50">{{
                        format(stakedWorth / 2, 'ALPH') }} ALPH</div>
                        <div class="leading-3 text-xs opacity-50">{{ format(stakedWorth / 2, 'ALPH') }}
                            AYIN</div>
                    </div>
                    <div class="flex flex-1 gap-2 items-center justify-between">
                        <div>
                            <div class="text-xs">Currently Staked</div>
                            <div class="text-calypso-700 dark:text-calypso-500 font-bold">{{
                        format(stakedWorth) }}</div>
                        </div>
                        <div>
                            <div class="text-xs">Rewards</div>
                            <div class="text-calypso-700 dark:text-calypso-500 font-bold">{{
                        format(claimableWorth) }}</div>
                        </div>
                        <div>
                            <div class="text-xs">Total Yield</div>
                            <div>{{ format(stakedWorth - stakedWorth * 0.72) }}</div>
                        </div>

                        <div>
                            <div class="text-xs">Total Deposited</div>
                            <div>{{ format(stakedWorth * 0.72) }}</div>
                        </div>
                    </div>
                </div>
            </li>
        </ul>
    </div>
</template>
