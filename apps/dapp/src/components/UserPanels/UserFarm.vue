<script setup lang="ts">
import { computed } from 'vue'
import type { FarmBalance } from '../../hooks/useUser'
import { usePrices } from '../../hooks/usePrices';
import { useCurrency } from '../../hooks/useCurrency';
import { useDiscordAccount } from '../../hooks/useDiscordAccount';
import ProxyImage from '../ProxyImage.vue';

const props = defineProps<{ farm: FarmBalance }>()

const { prices } = usePrices()
const { format } = useCurrency()
const { isActiveSubscription } = useDiscordAccount()

const poolShare = computed(() => {
     if (props.farm.pool) {
         return Number(props.farm.balance) / Number(props.farm.pool.totalSupply)
    }

    return 0;
})

const token0Balance = computed(() => {
    if (props.farm.pool) {
        return Number(props.farm.pool.amount0 / 10n ** BigInt(props.farm.pool.token0.decimals)) * poolShare.value
    }

    return Number(props.farm.balance) / 10 ** props.farm.single.decimals
})

const token1Balance = computed(() => {
    if (props.farm.pool) {
        return Number(props.farm.pool.amount1 / 10n ** BigInt(props.farm.pool.token1.decimals)) * poolShare.value
    }

    return null;
})

const token0Value = computed(() => {
    if (props.farm.pool) {
        return token0Balance.value * prices[props.farm.pool.token0.address]
    }

    return token0Balance.value * prices[props.farm.single.address]
})

const token1Value = computed(() => {
    if (props.farm.pool && token1Balance.value) {
        return token1Balance.value * prices[props.farm.pool.token1.address]
    }
    return null;
})

const totalValue = computed(() => token0Value.value + (token1Value.value || 0))

const options = {
    minimumFractionDigits: 4,
    significantDigits: 8,
};
const numberFormat = new Intl.NumberFormat("en-US", options);
</script>

<template>
    <li class="bg-zinc-300 dark:bg-calypso-900 max-w-2xl p-2 rounded">
        <!-- Pool -->
        <div class="flex gap-2 items-center justify-between" v-if="farm.pool">
            <div v-if="farm.pool.pair.logo" class="w-12 h-12 relative">
                <ProxyImage :src="farm.pool.pair.logo" :width="50" :height="50" class="w-12 h-12 position" />
            </div>
            <div v-else class="w-12 h-12 relative">
                <ProxyImage :src="farm.pool.token0.logo" :width="50" :height="50"
                    class="w-8 h-8 position rounded-full absolute left-0" />
                <ProxyImage :src="farm.pool.token1.logo" :width="50" :height="50"
                    class="w-8 h-8 position rounded-full absolute left-4 top-4" />
            </div>
            <div class="w-1/3">
                <div class="font-bold align-top flex items-center -mb-2 -mt-2">
                    {{ farm.pool.token0.symbol }}
                    <span class="font-black text-3xl pt-1">/</span>
                    {{ farm.pool.token1.symbol }}
                    <span class="text-xs ml-2 opacity-75">{{ numberFormat.format(Number(farm.balance) / 1e18)}}</span>
                </div>


                <div class="flex flex-col w-28 shrink">

                    <Popper content="Unlock with Pro" :hover="true" :disabled="isActiveSubscription">
                        <div class="leading-3 text-xs flex gap-4 justify-between">
                            <div class="opacity-75" :class="{ ['blur-[1.5px]']: !isActiveSubscription}">
                                {{numberFormat.format(token0Balance) }}</div>
                            <div class="opacity-50">{{ farm.pool.token0.symbol}}</div>
                        </div>
                        <div class="leading-3 text-xs flex gap-4 justify-between">
                            <div class="opacity-75" :class="{ ['blur-[1.5px]']: !isActiveSubscription}">
                                {{numberFormat.format(token1Balance) }}</div>
                            <div class="opacity-50">{{ farm.pool.token1.symbol}}</div>
                        </div>
                    </Popper>
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

                        <Popper content="Unlock with Pro" :hover="true" :disabled="isActiveSubscription">
                            <div class="text-calypso-700 dark:text-calypso-500 font-bold"
                                :class="{ ['blur-[2px]']: !isActiveSubscription}">
                                {{ Math.round(poolShare * 10000) / 100 }}%
                            </div>
                        </Popper>
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

        <!-- Single -->
        <div class="flex gap-2 items-center justify-between" v-if="farm.single">
            <div v-if="farm.single.logo" class="w-12 h-12 relative">
                <ProxyImage :src="farm.single.logo" :width="50" :height="50" class="w-12 h-12 position" />
            </div>
            <div class="w-1/3">
                <div class="font-bold align-top flex items-center -mb-2 -mt-2">
                    {{ farm.single.symbol }}
                    <span class="text-xs ml-2 opacity-75">{{ numberFormat.format(Number(farm.balance) / 10 **
                        farm.single.decimals)}}</span>
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
                    <div class="w-32 hidden md:block" v-if="false">
                        <div class="text-xs">Pool Share</div>

                        <Popper content="Unlock with Pro" :hover="true" :disabled="isActiveSubscription">
                            <div class="text-calypso-700 dark:text-calypso-500 font-bold"
                                :class="{ ['blur-[2px]']: !isActiveSubscription}">
                                {{ Math.round(poolShare * 10000) / 100 }}%
                            </div>
                        </Popper>
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
