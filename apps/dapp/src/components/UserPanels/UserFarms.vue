<script setup lang="ts">
import { ChevronDownIcon } from '@heroicons/vue/24/outline';
import { computed } from 'vue';
import { useCurrency } from '../../hooks/useCurrency';
import { usePrices } from '../../hooks/usePrices';
import { type FarmBalance, useUser  } from '../../hooks/useUser'
import UserFarm from './UserFarm.vue';

const { format } = useCurrency()
const { user } = useUser()
const { prices } = usePrices()

defineProps<{ value: number,total: number }>()

function getPoolValue(a: FarmBalance) {
    if (a.pool) {
        const poolShare = Number(a.balance) / Number(a.pool.totalSupply)
        const token0Balance = Number(a.pool.amount0 / 10n ** BigInt(a.pool.token0.decimals)) * poolShare
        const token1Balance = Number(a.pool.amount1 / 10n ** BigInt(a.pool.token1.decimals)) * poolShare
        const token0Value = token0Balance * (prices[a.pool.token0.address] || 0)
        const token1Value = token1Balance * (prices[a.pool.token1.address] || 0)
        return token0Value + token1Value
    }

    if (a.single) {
        const b = Number(a.balance) / 10 ** a.single.decimals
        return b * (prices[a.single.address] || 0)
    }

    return 0
}

const mergedFarms = computed(() => {
    return Array.from(user.farms.reduce((acc,cur) => {
        const key = cur.single?.address || cur.pool?.pair?.address
        if (!key) {
            console.warn(`Missing Farm for user ${cur.userAddress}`)
            return acc;
        }
        
        const prev = acc.get(key)

        if (prev) {
            prev.balance += cur.balance
            acc.set(key, prev)
        } else {
            acc.set(key, {
                ...cur,
                balance: cur.balance,
                userAddress: '', // merged positions, so no userAddress available
            })
        }
        
        return acc;
    }, new Map<string, typeof user.farms[number]>()).values())
})

const farms = computed(() => Array.from(mergedFarms.value).sort((a,b) => {
    const aValue = getPoolValue(a)
    const bValue = getPoolValue(b)
    return bValue - aValue
}))
const percent = new Intl.NumberFormat(navigator.language, { maximumFractionDigits: 1 });
</script>

<template>
    <details open class="[&_svg.icon]:open:-rotate-180 px-4 max-w-screen w-screen md:w-auto">
        <summary class="list-none flex items-center">
            <ChevronDownIcon class="w-4 mb-1 mr-2 icon" />
            Staking <span class="px-2 text-calypso-500">{{ format(value) }} ({{percent.format(value / total *
                100)}}%)</span>
        </summary>

        <ul class="py-4 w-full flex flex-col gap-2">
            <UserFarm v-for="farm in farms" :farm="farm" />
        </ul>
    </details>
</template>
