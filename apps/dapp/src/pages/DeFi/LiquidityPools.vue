<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import Table from '../../components/table/Table.vue';
import TableHead from '../../components/table/TableHead.vue';
import TableRow from '../../components/table/TableRow.vue';
import TableHeader from '../../components/table/TableHeader.vue';
import TableBody from '../../components/table/TableBody.vue';
import TableCell from '../../components/table/TableCell.vue';
import ExternalLink from '../../components/ExternalLink.vue';
import { usePrices } from '../../hooks/usePrices';
import { useCurrency } from '../../hooks/useCurrency';

const pools = ref([])
const { prices, updatePrices } = usePrices();
const { format } = useCurrency()

onMounted(async () => {
    const res = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/pools`).then(a => a.json());
    const tokens: string[] = Array.from(new Set(res.pools.flatMap(pool => [pool.token0.address, pool.token1.address])))
    pools.value = res.pools
    await updatePrices(tokens)
})

const options = {
				minimumFractionDigits: 2,
				significantDigits: 8,
			};
const numberFormat = new Intl.NumberFormat("en-US", options);

function getPoolTvl(pool) {
    const amount0 = pool.amount0 / 10 ** pool.token0.decimals
    const amount1 = pool.amount1 / 10 ** pool.token1.decimals
    return amount0 * prices[pool.token0.address] + amount1 * prices[pool.token1.address]
}

const sortedPools = computed(() => pools.value.sort((a, b) => getPoolTvl(b) - getPoolTvl(a)))

</script>
<template>
    <div>
        <Table>
            <TableHead>
                <TableRow>
                    <TableHeader>
                        Pair
                    </TableHeader>
                    <TableHeader>
                        Reserves
                    </TableHeader>

                    <TableHeader>
                        Total Supply
                    </TableHeader>


                    <TableHeader>
                        TVL
                    </TableHeader>

                    <TableHeader>
                        Links
                    </TableHeader>
                </TableRow>
            </TableHead>

            <TableBody>
                <TableRow v-for="(pool, idx) in sortedPools"
                    class="odd:dark:bg-calypso-800 even:dark:bg-calypso-900 odd:dark:hover:bg-calypso-700 even:dark:hover:bg-calypso-700 bg-zinc-300 odd:bg-zinc-300 even:bg-zinc-200">
                    <TableCell>
                        {{ pool.token0.symbol }} / {{ pool.token1.symbol}}
                    </TableCell>

                    <TableCell class="flex justify-between">
                        <div>
                            {{ numberFormat.format(pool.amount0 / 10 ** pool.token0.decimals) }} {{ pool.token0.symbol}}
                        </div>


                        <div>
                            {{ numberFormat.format(pool.amount1 / 10 ** pool.token1.decimals) }} {{ pool.token1.symbol}}
                        </div>
                    </TableCell>


                    <TableCell>
                        {{ numberFormat.format(pool.totalSupply / 1e18) }}
                    </TableCell>


                    <TableCell>
                        {{ format(getPoolTvl(pool)) }}
                    </TableCell>


                    <TableCell>
                        <ExternalLink :href="`https://explorer.alephium.org/addresses/${pool.pair.address}`">
                            {{ pool.pair.address.slice(0, 4) }}...{{ pool.pair.address.slice(-4) }}
                        </ExternalLink>
                    </TableCell>
                </TableRow>


            </TableBody>
        </Table>
    </div>
</template>
