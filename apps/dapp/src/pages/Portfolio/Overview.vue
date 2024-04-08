<script setup lang="ts">
import { computed, ref } from 'vue';
import { type TokenBalance, useUser, type PoolBalance, type FarmBalance, type NftBalance } from '../../hooks/useUser';
import { usePrices } from '../../hooks/usePrices';
import { useCurrency } from '../../hooks/useCurrency';

import { bs58 } from '@alephium/web3';
import ExternalLink from '../../components/ExternalLink.vue';
import { truncateAddress } from '../../utils/addresses';
import { useRoute } from 'vue-router';
import ProxyImage from '../../components/ProxyImage.vue';

import { ArrowPathIcon, ChevronDownIcon} from '@heroicons/vue/24/outline';
import UserTokens from '../../components/UserPanels/UserTokens.vue';
import UserPools from '../../components/UserPanels/UserPools.vue';
import UserFarms from '../../components/UserPanels/UserFarms.vue';
import UserNfts from '../../components/UserPanels/UserNfts.vue';
import { getPoolBreakdown } from '../../utils/pools';

const { user, refreshWallet } = useUser()
const { currency, format } = useCurrency()
const route = useRoute()

const { prices } = usePrices()

const tokenWorth = computed(() => {
    return user.tokens.reduce((acc: number, balance: TokenBalance) => {
        const b = Number(balance.balance) / 10 ** balance.token.decimals
        return acc + b * prices[balance.token.address]
    }, 0)
})
const lpWorth = computed(() => {
    return user.pools.reduce((acc: number, pool: PoolBalance) => {
        const { token0Balance, token1Balance } = getPoolBreakdown(pool)
        return acc
            + token0Balance * prices[pool.pool.token0.address]
            + token1Balance * prices[pool.pool.token1.address]
    }, 0)
})

const stakedWorth = computed(() => {
    return user.farms.reduce((acc: number, farm: FarmBalance) => {
        const { token0Balance, token1Balance } = getPoolBreakdown(farm)
        return acc
            + token0Balance * prices[farm.pool.token0.address]
            + token1Balance * prices[farm.pool.token1.address]
    }, 0)
})

const nftWorth = computed(() => {
    return user.nfts.reduce((acc: number, nft: NftBalance) => {
        // calculate all based on floor prices
        return acc + (Number(nft.nft.collection.floor) / 1e18) * prices.tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq
    }, 0)
})




const netWorth = computed(() => tokenWorth.value + nftWorth.value + lpWorth.value + stakedWorth.value)

const secondaryCurrencies = computed(() => {
    const options = ['USD', 'ALPH', 'BTC', 'ETH'] as const
    return options.filter(a => a !== currency.value).slice(0, 3)
})

const routeUserAddress = ref(route.params.address as string)

const isContract = computed(() => bs58.decode(routeUserAddress.value)[0] === 0x03)


</script>

<template>
    <div class="flex flex-col w-full max-w-2xl">

        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 w-full">
            <div
                class="col-span-2 bg-zinc-200 dark:bg-calypso-900 shadow-xl md:col-span-2 md:row-span-2 rounded p-2 flex flex-col justify-between border-b border-b-calypso-800">
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
                <span class="text-calypso-900 dark:text-calypso-300 text-sm opacity-75">Pools</span>
                <span class="text-lg font-bold">{{ format(lpWorth) }}</span>
            </div>
            <div
                class="bg-zinc-200 dark:bg-calypso-900 shadow-xl rounded p-2  flex flex-col border-b border-b-calypso-800">
                <span class="text-calypso-900 dark:text-calypso-300 text-sm opacity-75">NFTs</span>
                <span class="text-lg font-bold">{{ format(nftWorth) }}</span>
            </div>
            <!-- <div
                class="bg-zinc-200 dark:bg-calypso-900 shadow-xl rounded p-2  flex flex-col border-b border-b-calypso-800 hidden md:flex">
                <span class="text-calypso-900 dark:text-calypso-300 text-sm opacity-75">Claimable</span>
                <span class="text-lg font-bold">--</span>
            </div> -->
        </div>

        <div class="flex gap-2 p-4 w-full">
            <div
                class="px-4 py-2 bg-zinc-200 dark:bg-calypso-900 shadow-xl rounded flex flex-col md:items-center justify-between border-b border-b-calypso-800 w-full gap-2">
                <div class="flex items-center justify-between w-full">

                    <div class="md:hidden">
                        {{ truncateAddress(routeUserAddress, 24) }}
                    </div>

                    <div class="hidden md:inline-block">
                        {{ truncateAddress(routeUserAddress, 50) }} {{ }}
                    </div>
                    <button @click="() => refreshWallet(routeUserAddress)">
                        <ArrowPathIcon class="h-4 w-4 text-calypso-500" />
                    </button>
                </div>

                <div class="flex gap-4 justify-between w-full">
                    <span v-if="isContract"
                        class="bg-calypso-800 text-xs px-1 py-px flex items-center justify-center w-14 rounded-lg">Contract</span>


                    <div class="flex gap-4">
                        <ExternalLink :href="`https://explorer.alephium.org/addresses/${routeUserAddress}`" class="">
                            Explorer
                        </ExternalLink>

                        <ExternalLink :href="`https://deadrare.io/account/${routeUserAddress}`" class="">
                            DeadRare
                        </ExternalLink>
                    </div>
                </div>
            </div>
        </div>

        <UserTokens :value="tokenWorth" />

        <UserPools :value="lpWorth" />

        <template v-if="false">
            <UserFarms :value="stakedWorth" />
        </template>

        <UserNfts :value="nftWorth" />
    </div>
</template>
