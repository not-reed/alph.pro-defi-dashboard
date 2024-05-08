<script setup lang="ts">
import { computed } from 'vue'
import type { PoolBalance } from '../../hooks/useUser'
import { usePrices } from '../../hooks/usePrices';
import { useCurrency } from '../../hooks/useCurrency';
import { useDiscordAccount } from '../../hooks/useDiscordAccount';
import ProxyImage from '../ProxyImage.vue';

const props = defineProps<{ balance: PoolBalance }>()

const { prices } = usePrices()
const { format } = useCurrency()
const { isActiveSubscription } = useDiscordAccount()

const poolShare = computed(() => {
    return Number(props.balance.balance) / Number(props.balance.pool.totalSupply)
})

const token0Balance = computed(() => {
    return Number(props.balance.pool.amount0 / 10n ** BigInt(props.balance.pool.token0.decimals)) * poolShare.value
})

const token1Balance = computed(() => {
    return Number(props.balance.pool.amount1 / 10n ** BigInt(props.balance.pool.token1.decimals)) * poolShare.value
})

const token0Value = computed(() => {
    return token0Balance.value * prices[props.balance.pool.token0.address]
})

const token1Value = computed(() => {
    return token1Balance.value * prices[props.balance.pool.token1.address]
})

const totalValue = computed(() => token0Value.value + token1Value.value)

const options = {
    minimumFractionDigits: 4,
    significantDigits: 8,
};
const numberFormat = new Intl.NumberFormat("en-US", options);
</script>

<template>
    <li class="bg-zinc-300 dark:bg-calypso-900 max-w-2xl p-2 rounded">
        <div class="flex gap-2 items-center justify-between">

            <div v-if="balance.pool.pair?.logo" class="w-12 h-12 relative">
                <ProxyImage :src="balance.pool.pair.logo" :width="50" :height="50" class="w-12 h-12 position" />
            </div>
            <div v-else class="w-12 h-12 relative">
                <ProxyImage :src="balance.pool.token0.logo" :width="50" :height="50"
                    class="w-8 h-8 position rounded-full absolute left-0" />
                <ProxyImage :src="balance.pool.token1.logo" :width="50" :height="50"
                    class="w-8 h-8 position rounded-full absolute left-4 top-4" />
            </div>
            <div class="w-36">
                <div class="font-bold align-top flex items-center -mb-2 -mt-2">
                    {{ balance.pool.token0.symbol }}
                    <span class="font-black text-3xl pt-1">/</span>
                    {{ balance.pool.token1.symbol }}
                    <span class="text-xs ml-2 opacity-75">{{ numberFormat.format(Number(balance.balance) /
                        1e18)}}</span>
                </div>

                <div class="flex flex-col w-28 shrink">
                    <div class="leading-3 text-xs flex gap-4 justify-between">
                        <div class="opacity-75" :class="{ ['blur-[1.5px]']: !isActiveSubscription}">
                            {{numberFormat.format(token0Balance) }}</div>
                        <div class="opacity-50">{{ balance.pool.token0.symbol}}</div>
                    </div>
                    <div class="leading-3 text-xs flex gap-4 justify-between">
                        <div class="opacity-75" :class="{ ['blur-[1.5px]']: !isActiveSubscription}">
                            {{numberFormat.format(token1Balance) }}</div>
                        <div class="opacity-50">{{ balance.pool.token1.symbol}}</div>
                    </div>
                </div>

            </div>

            <div class="flex flex-1 gap-2 items-center justify-end">
                <div class="w-32 hidden md:block">
                    <div class="text-xs">Pool Share</div>
                    <div class="text-calypso-700 dark:text-calypso-500 font-bold"
                        :class="{ ['blur-[2px]']: !isActiveSubscription}">
                        {{ Math.round(poolShare * 10000) / 100 }}%
                    </div>
                </div>
                <div class="md:w-32">
                    <div class="text-xs">Total Value</div>
                    <div class="text-calypso-700 dark:text-calypso-500 font-bold">
                        {{ format(totalValue)}}
                    </div>
                </div>
            </div>
        </div>
    </li>
</template>
