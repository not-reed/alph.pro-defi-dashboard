<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Table from '../../components/table/Table.vue'
import TableBody from '../../components/table/TableBody.vue'
import TableHead from '../../components/table/TableHead.vue'
import TableRow from '../../components/table/TableRow.vue'
import TableHeader from '../../components/table/TableHeader.vue'
import TableCell from '../../components/table/TableCell.vue'
import { useCurrency } from '../../hooks/useCurrency';
import ProxyImage from '../../components/ProxyImage.vue';
import { truncateAddress } from '../../utils/addresses';
import ExternalLink from '../../components/ExternalLink.vue';

const { format } = useCurrency()

const swaps = ref([])
onMounted(async () => { updateSwaps() })

async function updateSwaps() {
    try {
        const swaps_ = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/swaps/liquidity`).then(a => a.json())
        swaps.value = swaps_.swaps
        setTimeout(updateSwaps, 5_000)
    } catch (error) {
        console.error(error)
        setTimeout(updateSwaps, 60_000)
    }
}

function getValue(amount: string, token: any) {
    if (!token) {
        return 0;
    }
    const normalizedAmount = Math.abs(amount) / 10 ** token.decimals
    const normalizedPrice = Number(token.price) / 1e18
    return normalizedAmount * normalizedPrice
}

function getSwapValue(swap: any) {
    return (getValue(swap.amount0, swap.pool?.token0) + getValue(swap.amount1, swap.pool?.token1))
}
const options = {
    minimumFractionDigits: 4,
    significantDigits: 8,
};
const numberFormat = new Intl.NumberFormat("en-US", options);
</script>
<template>
    <div>
        <Table class="max-w-md">
            <TableHead>
                <TableRow>
                    <TableHeader>User</TableHeader>
                    <TableHeader>Amount</TableHeader>
                    <TableHeader>LP Tokens</TableHeader>
                    <TableHeader>Value</TableHeader>
                    <TableHeader>Timestamp</TableHeader>
                    <TableHeader>Transaction</TableHeader>
                </TableRow>
            </TableHead>

            <!-- <TableBody> -->
            <TransitionGroup name="list" tag="tbody">
                <TableRow v-for="swap in swaps" :key="swap.transactionHash"
                    class="whitespace-nowrap odd:dark:bg-calypso-800 even:dark:bg-calypso-900 odd:dark:hover:bg-calypso-700 even:dark:hover:bg-calypso-700 bg-zinc-300 odd:bg-zinc-300 even:bg-zinc-200">

                    <TableCell>
                        <RouterLink :to="`/portfolio/overview/${swap.userAddress}`"
                            class="text-calypso-500 cursor-pointer flex items-center justify-start font-mono">
                            {{truncateAddress(swap.userAddress, 12)}}
                            <!-- <span v-if="holder.isContract"
                                class="bg-calypso-800 text-xs px-1 py-px flex items-center justify-center w-14 rounded-lg">Contract</span> -->
                        </RouterLink>

                    </TableCell>

                    <TableCell class="">
                        <div class="flex flex-col"
                            :class="{ 'text-red-500': swap.action === 'Burn', 'text-emerald-500': swap.action === 'Mint'}">

                            <div class="flex justify-between gap-2 items-center" v-if="swap?.pool?.token0">
                                {{ numberFormat.format(
                                Math.abs(swap.amount0) / 10 ** swap.pool.token0.decimals) }}
                                <div class="flex items-center justify-end">
                                    <span class="text-ellipsis text-right overflow-hidden w-20">{{
                                        swap.pool.token0.symbol }}</span>
                                    <ProxyImage :src="swap.pool.token0.logo" :width="50" :height="50"
                                        class="rounded-full h-4" />
                                </div>
                            </div>
                            <div class="flex justify-between gap-2 items-center" v-else>
                                ---
                                <div class="flex items-center justify-end">
                                    <span class="text-ellipsis text-right overflow-hidden">---</span>
                                </div>
                            </div>

                            <div class="flex justify-between gap-2 items-center" v-if="swap?.pool?.token1">
                                {{ numberFormat.format(
                                Math.abs(swap.amount1) / 10 ** swap.pool.token1.decimals) }}
                                <div class="flex items-center justify-end">
                                    <span class="text-ellipsis text-right overflow-hidden w-20">{{
                                        swap.pool.token1.symbol }}</span>
                                    <ProxyImage :src="swap.pool.token1.logo" :width="50" :height="50"
                                        class="rounded-full h-4" />
                                </div>
                            </div>
                            <div class="flex justify-between gap-2 items-center" v-else>
                                ---
                                <div class="flex items-center justify-end">
                                    <span class="text-ellipsis text-right overflow-hidden">---</span>
                                </div>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell
                        :class="{ 'text-red-500': swap.action === 'Burn', 'text-emerald-500': swap.action === 'Mint'}">
                        {{ numberFormat.format(swap.liquidity / 1e18) }}</TableCell>

                    <TableCell>{{ format(getSwapValue(swap)) }}</TableCell>
                    <TableCell>{{ new Date(swap.timestamp).toLocaleTimeString() }}</TableCell>
                    <TableCell>
                        <ExternalLink :href="`https://explorer.alephium.org/transactions/${swap.transactionHash}`"
                            class="font-mono">
                            {{ truncateAddress(swap.transactionHash, 10) }}
                        </ExternalLink>

                    </TableCell>
                </TableRow>
            </TransitionGroup>
            <!-- </TableBody> -->
        </Table>
    </div>
</template>

<style>
.list-enter-active,
.list-leave-active {
    transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
    opacity: 0;
    transform: translateX(30px);
}
</style>
