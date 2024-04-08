<script setup lang="ts">
import { type PoolBalance, useUser } from '../../hooks/useUser';
import { ChevronDownIcon } from '@heroicons/vue/24/outline';
import UserPool from './UserPool.vue';
import { computed } from 'vue';
import { usePrices } from '../../hooks/usePrices';
import { useCurrency } from '../../hooks/useCurrency';

const { format } = useCurrency()
const { user } = useUser()
const { prices } = usePrices()

defineProps<{ value: number }>()

function getPoolValue(a: PoolBalance) {
    const poolShare = Number(a.balance) / Number(a.pool.totalSupply)
    const token0Balance = Number(a.pool.amount0 / 10n ** BigInt(a.pool.token0.decimals)) * poolShare
    const token1Balance = Number(a.pool.amount1 / 10n ** BigInt(a.pool.token1.decimals)) * poolShare
    const token0Value = token0Balance * prices[a.pool.token0.address]
    const token1Value = token1Balance * prices[a.pool.token1.address]
    return token0Value + token1Value
}

const pools = computed(() => Array.from(user.pools).sort((a,b) => {

    const aValue = getPoolValue(a)
    const bValue = getPoolValue(b)
    return bValue - aValue
}))
</script>

<template>
    <details open class="[&_svg.icon]:open:-rotate-180">
        <summary class="px-4 list-none flex items-center">
            <ChevronDownIcon class="w-4 mb-1 mr-2 icon" />
            Pools <span class="px-2 text-calypso-500">{{ format(value) }}</span>
        </summary>

        <!-- TODO: only show i.e. top 10 tokens here? -->
        <ul class="px-4 py-4 w-full flex flex-col gap-2">
            <UserPool v-for="balance in pools" :balance="balance" />
        </ul>
    </details>

</template>
