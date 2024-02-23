<script setup lang="ts">
import { computed } from 'vue';
import Icon from '../../components/Icon.vue';
import { useUser } from '../../hooks/useUser';

const { user } = useUser()

const cryptoSymbols = {
    "ALPH": "ℵ",
    "ETH": "Ξ",
    "BTC": "₿"
}

function formatCrypto(currency_: keyof typeof cryptoSymbols) {
    const currency = currency_ === 'ALPH' ? 'ETH' : currency_
    return {
        format: (amount: number) => {
            const options = { style: 'currency', currency, minimumFractionDigits: 8 };
            const numberFormat = new Intl.NumberFormat('en-US', options);
            const parts = numberFormat.formatToParts(amount)

            return parts.reduce((acc, part) => {
                switch (part.type) {
                    case 'currency': {

                        console.log({ acc, cur: cryptoSymbols[currency] })
                        // do whatever you need with the symbol. 
                        // here I just replace it with the value from the map
                        return `${acc}${cryptoSymbols[currency_]}`
                    }
                    default:
                        return `${acc}${part.value}`
                }
            }, '')
        }
    }
}
const format = {
    currency: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }),
    btc: formatCrypto('BTC'),
    eth: formatCrypto('ETH'),
    alph: formatCrypto('ALPH'),
    // eth: new Intl.NumberFormat('en-US', {
    //     style: 'currency',
    //     currency: 'Ξ',
    // }),
    // alph: new Intl.NumberFormat('en-US', {
    //     style: 'currency',
    //     currency: 'ℵ',
    // }),
    number: new Intl.NumberFormat('en-US', {
        style: 'decimal',
    }),
}

// TODO: fetch prices
const alphPrice = 2.88
const ayinPrice = 11.40
const xAyinPrice = ayinPrice * 1.6212
const nguPrice = 0.21
const vladPrice = 0.19
const jkylPrice = 0.005
interface PartialToken {
    balance: number
    price: number
}
const pricedTokens = computed(() => user.balances.reduce((acc, balance) => {
    if (!balance.token?.verified) {
        return acc;
    }
    const b = balance.balance / 10 ** 18 / 100

    const price = {
        // alph
        'tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq': alphPrice,
        // ayin
        'vT49PY8ksoUL6NcXiZ1t2wAmC7tTPRfFfER8n3UCLvXy': ayinPrice,
        // xayin
        'zst5zMzizEeFYFis6DNSknY5GCYTpM85D3yXeRLe2ug3': xAyinPrice,
        // ngu
        '29iBWdXaC94V2oe4pqV5AEM8H3JBDCXgZBStuig1QSvXh': nguPrice,
        '239NpfNCR6mVyJKrm171YaNkDfwAe6kQnBr6Kg8gXV5CK': vladPrice,
        'wdod8Kda3YtrykkHJVZ85LWs2caUSUgUnuqgYiv5hh5R': jkylPrice
    }[balance.token.address as string] ?? Math.random()
    return acc.concat({
        ...balance,
        // TODO: IN TESTING ALL TOKENS HAVE 18 DECIMALS. THIS IS NOT THE CASE
        balance: b,
        // balance: balance.balance / 10 ** balance.token.decimals / 100,
        // balance: Math.floor(
        //     Math.round(balance.balance / 10 ** balance.token.decimals * 100)
        //     / 10000000000),
        price,
    })
}, [] as PartialToken[]).sort((a: PartialToken, b: PartialToken) => (b.balance * b.price) - (a.balance * a.price)))
const tokenWorth = computed(() => {
    return pricedTokens.value.reduce((acc: number, balance: PartialToken) => {
        return acc + balance.price * balance.balance
    }, 0)
})
const stakedWorth = 0
const nftWorth = 0
const claimableWorth = 0

const netWorth = computed(() => tokenWorth.value + stakedWorth + nftWorth + claimableWorth)

</script>
<template>
    <div class="flex flex-col w-full max-w-2xl">
        <div class="grid grid-cols-4 gap-2 m-4 w-full">
            <div
                class="bg-zinc-200 dark:bg-calypso-900 shadow-xl col-span-2 row-span-2 rounded p-2 flex flex-col justify-between border-b border-b-calypso-800">
                <span class="text-calypso-800 dark:text-calypso-300 text-sm opacity-75">Net Worth</span>
                <span class="text-2xl font-bold  text-calypso-700 dark:text-calypso-500">{{ format.currency.format(netWorth)
                }}</span>
                <span class="text-base leading-4">{{ format.btc.format(netWorth / 52000) }}</span>
                <span class="text-base leading-4">{{ format.eth.format(netWorth / 2800) }}</span>
                <span class="text-base leading-4">{{ format.alph.format(netWorth / 2.80) }}</span>
            </div>

            <div class="bg-zinc-200 dark:bg-calypso-900 shadow-xl rounded p-2  flex flex-col border-b border-b-calypso-800">
                <span class="text-calypso-900 dark:text-calypso-300 text-sm opacity-75">Wallet</span>
                <span class="text-lg font-bold">{{ format.currency.format(tokenWorth) }}</span>
            </div>
            <div class="bg-zinc-200 dark:bg-calypso-900 shadow-xl rounded p-2  flex flex-col border-b border-b-calypso-800">
                <span class="text-calypso-900 dark:text-calypso-300 text-sm opacity-75">Staked</span>
                <span class="text-lg font-bold">{{ format.currency.format(stakedWorth) }}</span>
            </div>
            <div class="bg-zinc-200 dark:bg-calypso-900 shadow-xl rounded p-2  flex flex-col border-b border-b-calypso-800">
                <span class="text-calypso-900 dark:text-calypso-300 text-sm opacity-75">NFTs</span>
                <span class="text-lg font-bold">{{ format.currency.format(nftWorth) }}</span>
            </div>
            <div class="bg-zinc-200 dark:bg-calypso-900 shadow-xl rounded p-2  flex flex-col border-b border-b-calypso-800">
                <span class="text-calypso-900 dark:text-calypso-300 text-sm opacity-75">Claimable</span>
                <span class="text-lg font-bold">{{ format.currency.format(claimableWorth) }}</span>
            </div>
        </div>

        <!-- TODO: only show i.e. top 10 tokens here -->
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

                <div v-if="balance.price" class="opacity-50">{{ format.currency.format(balance.price) }}</div>


                <div v-if="balance.price" class="font-bold text-calypso-700 dark:text-calypso-500">{{
                    format.currency.format(balance.price *
                        balance.balance) }}
                </div>

            </li>
            <!-- <li
                class="shadow dark:bg-calypso-900 bg-zinc-200 grid grid-cols-3 grid-flow-col auto-cols-min items-center justify-between gap-2 rounded-l-full pr-2">
                <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                        stroke="currentColor" class="w-8 h-8 bg-zinc-800 rounded-full text-calypso-400">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>

                    <div class="pl-2 text-sm opacity-50">View More</div>
                </div>
            </li> -->
        </ul>

        <!-- TODO: Ranked by Rarest+Highest Floor -->
        <!-- Only show first 4 or 8 -->
        <ul class="grid grid-cols-4 flex-wrap gap-2 mx-4 pt-4 w-full" v-if="false">
            <li class="flex flex-col gap-1 bg-zinc-300 dark:bg-calypso-900 p-2 rounded shadow">
                <img class="w-full h-32 shadow-lg object-cover rounded mb-3"
                    src="https://ipfs.filebase.io/ipfs/QmRundkH8cjoZvdSJtUbEGZddF3qEDPgqeBjendVisLi8Y/36.svg" />
                <div class="text-sm flex items-center justify-between leading-3">
                    <div class="text-xs opacity-50">Ranked:</div>
                    <div class="font-bold">83</div>
                </div>
                <div class="text-sm flex items-center justify-between leading-3">
                    <div class="text-xs opacity-50">Floor:</div>
                    <div class="text-calypso-700 dark:text-calypso-500 font-bold">180 ALPH</div>
                </div>
                <div class="text-sm flex items-center justify-between leading-3">
                    <div class="text-xs opacity-50">Listed:</div> -
                </div>
            </li>

            <li class="flex flex-col gap-1 bg-zinc-300 dark:bg-calypso-900 p-2 rounded shadow">
                <img class="w-full h-32 shadow-lg object-cover rounded mb-3"
                    src="https://jade-particular-whale-845.mypinata.cloud/ipfs/QmWD4YFTMgwZ7QYMQW2KLAyNPC3QhzejaTrq8vrhH83ZSG/209.png" />
                <div class="text-sm flex items-center justify-between leading-3">
                    <div class="text-xs opacity-50">Ranked:</div>
                    <div class="font-bold">11</div>
                </div>
                <div class="text-sm flex items-center justify-between leading-3">
                    <div class="text-xs opacity-50">Floor:</div>
                    <div class="text-calypso-700 dark:text-calypso-500 font-bold">17 ALPH</div>
                </div>
                <div class="text-sm flex items-center justify-between leading-3">
                    <div class="text-xs opacity-50">Listed:</div> -
                </div>
            </li>


            <li class="flex flex-col gap-1 bg-zinc-300 dark:bg-calypso-900 p-2 rounded shadow">
                <img class="w-full h-32 shadow-lg object-cover rounded mb-3"
                    src="https://3isps7srobiklf6wmizc43d2kuyqcczfytliigjldlcfmqqetxha.arweave.net/2iT5flFwUKWX1mIyLmx6VTEBCyXE1oQZKxrEVkIEnc4/21.png" />
                <div class="text-sm flex items-center justify-between leading-3">
                    <div class="text-xs opacity-50">Ranked:</div>
                    <div class="font-bold">44</div>
                </div>
                <div class="text-sm flex items-center justify-between leading-3">
                    <div class="text-xs opacity-50">Floor:</div>
                    <div class="text-calypso-700 dark:text-calypso-500 font-bold">248 ALPH</div>
                </div>
                <div class="text-sm flex items-center justify-between leading-3">
                    <div class="text-xs opacity-50">Listed:</div> 777 ALPH
                </div>
            </li>
        </ul>

        <ul class="m-4 pt-4 w-full flex flex-col gap-2" v-if="false">
            <li class="bg-zinc-300 dark:bg-calypso-900 max-w-2xl p-4 rounded">
                <div class="flex gap-2 items-center justify-between">
                    <img src="../../assets/ayin.png" class="w-12 h-12 position" />
                    <div class="w-1/3">
                        <div class="font-bold">ALPH-AYIN</div>
                        <div class="leading-3 text-xs opacity-50">{{
                            format.number.format(stakedWorth / 2 / alphPrice) }} ALPH</div>
                        <div class="leading-3 text-xs opacity-50">{{ format.number.format(stakedWorth / 2 / ayinPrice) }}
                            AYIN</div>
                    </div>
                    <div class="flex flex-1 gap-2 items-center justify-between">
                        <div>
                            <div class="text-xs">Currently Staked</div>
                            <div class="text-calypso-700 dark:text-calypso-500 font-bold">{{
                                format.currency.format(stakedWorth) }}</div>
                        </div>
                        <div>
                            <div class="text-xs">Rewards</div>
                            <div class="text-calypso-700 dark:text-calypso-500 font-bold">{{
                                format.currency.format(claimableWorth) }}</div>
                        </div>
                        <div>
                            <div class="text-xs">Total Yield</div>
                            <div>{{ format.currency.format(stakedWorth - stakedWorth * 0.72) }}</div>
                        </div>

                        <div>
                            <div class="text-xs">Total Deposited</div>
                            <div>{{ format.currency.format(stakedWorth * 0.72) }}</div>
                        </div>
                    </div>
                </div>
            </li>
        </ul>
    </div>
</template>
