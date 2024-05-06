<script setup lang="ts">
import { type FarmBalance, useUser  } from '../../hooks/useUser'
import { ChevronDownIcon } from '@heroicons/vue/24/outline';
import UserFarm from './UserFarm.vue';
import { computed } from 'vue';
import { usePrices } from '../../hooks/usePrices';
import { useCurrency } from '../../hooks/useCurrency';

const { format } = useCurrency()
const { user } = useUser()
const { prices } = usePrices()

defineProps<{ value: number }>()

function getPoolValue(a: FarmBalance) {
    const poolShare = Number(a.balance) / Number(a.pool.totalSupply)
    const token0Balance = Number(a.pool.amount0 / 10n ** BigInt(a.pool.token0.decimals)) * poolShare
    const token1Balance = Number(a.pool.amount1 / 10n ** BigInt(a.pool.token1.decimals)) * poolShare
    const token0Value = token0Balance * prices[a.pool.token0.address]
    const token1Value = token1Balance * prices[a.pool.token1.address]
    return token0Value + token1Value
}

const farms = computed(() => Array.from(user.farms).sort((a,b) => {
    const aValue = getPoolValue(a)
    const bValue = getPoolValue(b)
    return bValue - aValue
}))
</script>

<template>
    <details open class="[&_svg.icon]:open:-rotate-180 px-4 max-w-screen w-screen md:w-auto">
        <summary class="list-none flex items-center">
            <ChevronDownIcon class="w-4 mb-1 mr-2 icon" />
            Staking <span class="px-2 text-calypso-500">{{ format(value) }}</span>
        </summary>

        <ul class="py-4 w-full flex flex-col gap-2">
            <UserFarm v-for="farm in farms" :farm="farm" />
        </ul>
    </details>
</template>
