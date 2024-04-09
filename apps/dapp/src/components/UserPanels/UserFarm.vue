<script setup lang="ts">
import { computed } from 'vue'
import type { FarmBalance } from '../../hooks/useUser'
import { usePrices } from '../../hooks/usePrices';
import { useCurrency } from '../../hooks/useCurrency';

const props = defineProps<{ farm: FarmBalance }>()

const { prices } = usePrices()
const { format } = useCurrency()

const poolShare = computed(() => {
    return Number(props.farm.balance) / Number(props.farm.pool.totalSupply)
})

const token0Balance = computed(() => {
    return Number(props.farm.pool.amount0 / 10n ** BigInt(props.farm.pool.token0.decimals)) * poolShare.value
})

const token1Balance = computed(() => {
    return Number(props.farm.pool.amount1 / 10n ** BigInt(props.farm.pool.token1.decimals)) * poolShare.value
})

const token0Value = computed(() => {
    return token0Balance.value * prices[props.farm.pool.token0.address]
})

const token1Value = computed(() => {
    return token1Balance.value * prices[props.farm.pool.token1.address]
})

const totalValue = computed(() => token0Value.value + token1Value.value)

const options = {
				minimumFractionDigits: 2,
				significantDigits: 8,
			};
			const numberFormat = new Intl.NumberFormat("en-US", options);
</script>

<template>
    <li class="bg-zinc-300 dark:bg-calypso-900 max-w-2xl p-2 rounded">
        <div class="flex gap-2 items-center justify-between">
            <div v-if="farm.pool.pair.logo" class="w-12 h-12 relative">
                <img :src="farm.pool.pair.logo" class="w-12 h-12 position" />
            </div>
            <div v-else class="w-12 h-12 relative">
                <img :src="farm.pool.token0.logo" class="w-8 h-8 position rounded-full absolute left-0" />
                <img :src="farm.pool.token1.logo" class="w-8 h-8 position rounded-full absolute left-4 top-4" />
            </div>
            <div class="w-1/3">
                <div class="font-bold align-top flex items-center -mb-2 -mt-2">
                    {{ farm.pool.token0.symbol }}
                    <span class="font-black text-3xl pt-1">/</span>
                    {{ farm.pool.token1.symbol }}
                </div>


                <div class="flex flex-col w-28 shrink">
                    <div class="leading-3 text-xs flex gap-4 justify-between">
                        <div class="opacity-75">{{numberFormat.format(token0Balance) }}</div>
                        <div class="opacity-50">{{ farm.pool.token0.symbol}}</div>
                    </div>
                    <div class="leading-3 text-xs flex gap-4 justify-between">
                        <div class="opacity-75">{{numberFormat.format(token1Balance) }}</div>
                        <div class="opacity-50">{{ farm.pool.token1.symbol}}</div>
                    </div>
                </div>
            </div>
            <div class="flex flex-1 gap-2 items-center justify-between">
                <!-- <div>
                    <div class="text-xs">Currently Staked</div>
                    <div class="text-calypso-700 dark:text-calypso-500 font-bold">
                        {{ format(stakedWorth) }}
                    </div>
                </div> -->
                <!-- <div>
                    <div class="text-xs">Rewards</div>
                    <div class="text-calypso-700 dark:text-calypso-500 font-bold">
                        {{ format(claimableWorth) }}
                    </div>
                </div> -->
                <!-- <div>
                    <div class="text-xs">Total Yield</div>
                    <div>{{ format(stakedWorth - stakedWorth * 0.72) }}</div>
                </div> -->

                <!-- <div>
                    <div class="text-xs">Total Deposited</div>
                    <div>{{ format(stakedWorth * 0.72) }}</div>
                </div> -->

                <div class="flex flex-1 gap-2 items-center justify-end">
                    <div class="w-32 hidden md:block">
                        <div class="text-xs">Pool Share</div>
                        <div class="text-calypso-700 dark:text-calypso-500 font-bold">
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
        </div>
    </li>
</template>
