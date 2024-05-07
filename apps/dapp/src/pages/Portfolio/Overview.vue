<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
    Combobox,
    ComboboxInput,
    ComboboxOptions,
    ComboboxOption,
    ComboboxButton,
    TransitionRoot
  } from '@headlessui/vue'
import { type TokenBalance, useUser, type PoolBalance, type FarmBalance, type NftBalance } from '../../hooks/useUser';
import { usePrices } from '../../hooks/usePrices';
import { useCurrency } from '../../hooks/useCurrency';

import { bs58 } from '@alephium/web3';
import ExternalLink from '../../components/ExternalLink.vue';
import { truncateAddress } from '../../utils/addresses';
import {  useRoute, useRouter } from 'vue-router';

import { ArrowPathIcon, CheckIcon, ChevronUpDownIcon } from '@heroicons/vue/24/outline';
import UserTokens from '../../components/UserPanels/UserTokens.vue';
import UserPools from '../../components/UserPanels/UserPools.vue';
import UserFarms from '../../components/UserPanels/UserFarms.vue';
import UserNfts from '../../components/UserPanels/UserNfts.vue';
import { getPoolBreakdown } from '../../utils/pools';
import { useDiscordAccount } from '../../hooks/useDiscordAccount';
import Clipboard from '../../components/Clipboard.vue';

const { user, refreshWallet} = useUser()
const { currency, format } = useCurrency()
const route = useRoute()
const { wallets, isActiveSubscription } = useDiscordAccount()
const farmsEnabled = true

const { prices } = usePrices()

const router = useRouter()

  const query = ref('')
  const filteredAddresses = computed(() =>
    query.value === ''
      ? wallets.value.map(w => w.address)
      : wallets.value.map(w => w.address).filter((person) => person.toLowerCase().includes(query.value.toLowerCase()))
  )

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
    if (!farmsEnabled) {
        return 0
    }
    return user.farms.reduce((acc: number, farm: FarmBalance) => {
        if (farm.pool) {
            const { token0Balance, token1Balance } = getPoolBreakdown(farm)
            return acc
            + token0Balance * prices[farm.pool.token0.address]
            + token1Balance * prices[farm.pool.token1.address]
        }

        const balance = Number(farm.balance) / 10 ** farm.single.decimals
        return balance * prices[farm.single.address]
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

function viewWallet(address: string) {
    router.push(`/portfolio/overview/${address}`)
}


watch(route, (route) => {
    routeUserAddress.value = route.params.address as string
})

</script>

<template>
    <div class="flex flex-col max-w-2xl">
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
                <div class="w-full flex items-center gap-2">
                    <form @submit.prevent="viewWallet(routeUserAddress)" class="w-full">
                        <Combobox v-model="routeUserAddress" @update:model-value="viewWallet(routeUserAddress)"
                            name="userAddress" class="w-full" readonly>
                            <div class="relative mt-1">
                                <div
                                    class="relative w-full cursor-default overflow-hidden rounded-lg bg-zinc-200 dark:bg-calypso-900  text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">

                                    <ComboboxInput
                                        class="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 focus:ring-0 dark:bg-calypso-800"
                                        @keyDown.enter="viewWallet(query)"
                                        :displayValue="() => truncateAddress(routeUserAddress, 50)"
                                        @change="query = $event.target.value" />

                                    <ComboboxButton class="absolute inset-y-0 right-0 flex items-center pr-2">
                                        <ChevronUpDownIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
                                    </ComboboxButton>
                                </div>

                                <TransitionRoot leave="transition ease-in duration-100" leaveFrom="opacity-100"
                                    leaveTo="opacity-0" @after-leave="query = ''">
                                    <ComboboxOptions
                                        class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-zinc-200 dark:bg-calypso-900 py-1  shadow-lg  focus:outline-none sm:text-sm">

                                        <ComboboxOption v-for="person in filteredAddresses" as="template" :key="person"
                                            v-if="isActiveSubscription" :value="person" v-slot="{ selected, active }">
                                            <li class="relative cursor-default select-none py-2 pl-10 pr-4"
                                                :class="{ 'bg-teal-600 text-white': active, 'text-gray-900': !active }">
                                                <span class="block truncate text-calypso-400"
                                                    :class="{ 'font-medium': selected, 'font-normal': !selected }">
                                                    {{ person }}
                                                </span>
                                                <span v-if="selected"
                                                    class="absolute inset-y-0 left-0 flex items-center pl-3"
                                                    :class="{ 'text-white': active, 'text-teal-600': !active }">
                                                    <CheckIcon class="h-5 w-5" aria-hidden="true" />
                                                </span>
                                            </li>
                                        </ComboboxOption>
                                        <ComboboxOption as="template" :value="query" v-slot="{ selected, active }"
                                            v-if="!filteredAddresses.some(a => a === (query || routeUserAddress))">
                                            <li class="relative cursor-default select-none py-2 pl-10 pr-4"
                                                :class="{ 'bg-zinc-300 dark:bg-calypso-700 text-zinc-700': active, 'text-gray-900': !active }">
                                                <span class="block truncate dark:text-calypso-400"
                                                    :class="{ 'font-medium': selected, 'font-normal': !selected }">
                                                    {{ query || routeUserAddress }}
                                                </span>
                                                <span v-if="selected"
                                                    class="absolute inset-y-0 left-0 flex items-center pl-3"
                                                    :class="{ 'text-white': active, 'text-teal-600': !active }">
                                                    <CheckIcon class="h-5 w-5" aria-hidden="true" />
                                                </span>
                                            </li>
                                        </ComboboxOption>
                                    </ComboboxOptions>
                                </TransitionRoot>
                            </div>
                        </Combobox>
                    </form>

                    <Clipboard :text="routeUserAddress"
                        class="h-6 w-6 relative text-calypso-500 hover:text-calypso-600 transition" />

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

        <template v-if="farmsEnabled">
            <UserFarms :value="stakedWorth" />
        </template>

        <UserNfts :value=" nftWorth" />
    </div>
</template>
