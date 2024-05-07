<script setup lang="ts">
import { onMounted, ref } from "vue";
import Table from "../../components/table/Table.vue";
import TableBody from "../../components/table/TableBody.vue";
import TableHead from "../../components/table/TableHead.vue";
import TableRow from "../../components/table/TableRow.vue";
import TableHeader from "../../components/table/TableHeader.vue";
import TableCell from "../../components/table/TableCell.vue";
import { useCurrency } from "../../hooks/useCurrency";
import ProxyImage from "../../components/ProxyImage.vue";
import { truncateAddress } from "../../utils/addresses";
import ExternalLink from "../../components/ExternalLink.vue";

const { format } = useCurrency();

const swaps = ref([]);
onMounted(async () => {
	updateSwaps();
});

async function updateSwaps() {
	try {
		const swaps_ = await fetch(
			`${import.meta.env.VITE_API_ENDPOINT}/api/swaps`,
		).then((a) => a.json());
		swaps.value = swaps_.swaps;
		setTimeout(updateSwaps, 5_000);
	} catch (error) {
		console.error(error);
		setTimeout(updateSwaps, 60_000);
	}
}

function getValue(amount: string, token: any) {
	if (!token) {
		return 0;
	}
	const normalizedAmount = Math.abs(amount) / 10 ** token.decimals;
	const normalizedPrice = Number(token.price) / 1e18;
	return normalizedAmount * normalizedPrice;
}

function getSwapValue(swap: any) {
	return (
		(getValue(swap.amount0, swap.pool.token0) +
			getValue(swap.amount1, swap.pool.token1)) /
		2
	);
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
            <TableHead class="sticky top-10">
                <TableRow>
                    <TableHeader>User</TableHeader>
                    <TableHeader>Swap</TableHeader>
                    <TableHeader>Value</TableHeader>
                    <TableHeader>Time</TableHeader>
                    <TableHeader>Transaction</TableHeader>
                </TableRow>
            </TableHead>

            <!-- <TableBody> -->
            <TransitionGroup name="list" tag="tbody">
                <TableRow v-for="swap in swaps" :key="swap.transactionHash"
                    class="whitespace-nowrap odd:dark:bg-calypso-800 even:dark:bg-calypso-900 odd:dark:hover:bg-calypso-700 even:dark:hover:bg-calypso-700 bg-zinc-300 odd:bg-zinc-300 even:bg-zinc-200">

                    <!-- {{ swap }} -->
                    <TableCell>
                        <RouterLink :to="`/portfolio/overview/${swap.userAddress}`"
                            class="text-calypso-500 cursor-pointer flex items-center justify-start font-mono">
                            {{truncateAddress(swap.userAddress, 12)}}
                            <!-- <span v-if="holder.isContract"
                                class="bg-calypso-800 text-xs px-1 py-px flex items-center justify-center w-14 rounded-lg">Contract</span> -->
                        </RouterLink>

                    </TableCell>
                    <!-- <TableCell>{{ swap.timestamp }}</TableCell> -->
                    <!-- <TableCell>{{ swap.transactionHash }}</TableCell> -->

                    <TableCell class="flex flex-col">
                        <div class="text-emerald-500 flex justify-between gap-4 items-center"
                            v-if="Number(swap.amount1) > 0 ? swap.pool.token0 : swap.pool.token1">
                            {{ numberFormat.format(Number(swap.amount1) > 0
                            ?
                            Math.abs(swap.amount0) / 10 **
                            swap.pool.token0.decimals :
                            Math.abs(swap.amount1) / 10 ** swap.pool.token1.decimals) }}
                            <div class="flex items-center justify-end">
                                <span class="text-ellipsis text-right overflow-hidden w-20">{{ Number(swap.amount1) > 0
                                    ?
                                    swap.pool.token0.symbol :
                                    swap.pool.token1.symbol }}</span>
                                <ProxyImage
                                    :src="Number(swap.amount0) > 0 ? swap.pool.token1.logo : swap.pool.token0.logo"
                                    :width="50" :height="50" class="rounded-full h-4 w-4" />
                            </div>
                        </div>

                        <div class="text-rose-500 flex justify-between gap-4 items-center"
                            v-if="Number(swap.amount0) > 0 ? swap.pool.token0 : swap.pool.token1">

                            {{ numberFormat.format(Number(swap.amount0) > 0 ? Math.abs(swap.amount0) / 10 **
                            swap.pool.token0.decimals :
                            Math.abs(swap.amount1) / 10 ** swap.pool.token1.decimals) }}
                            <div class="flex items-center justify-end">
                                <span class="text-ellipsis text-right overflow-hidden w-20">{{ Number(swap.amount0) > 0
                                    ?
                                    swap.pool.token0.symbol :
                                    swap.pool.token1.symbol }}</span>
                                <ProxyImage
                                    :src="Number(swap.amount0) > 0 ? swap.pool.token0.logo : swap.pool.token1.logo"
                                    :width="50" :height="50" class="rounded-full h-4" />
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>{{ format(getSwapValue(swap)) }}</TableCell>
                    <TableCell>
                        <div>{{ new Date(swap.timestamp).toLocaleTimeString() }}</div>
                    </TableCell>
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
