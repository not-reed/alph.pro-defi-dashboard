<script setup lang="ts">
import { computed } from 'vue';
import { useCurrency } from '../../hooks/useCurrency';
import { usePrices } from '../../hooks/usePrices';
import { useUser  } from '../../hooks/useUser'
import { ChevronDownIcon } from '@heroicons/vue/24/outline';
import ProxyImage from '../../components/ProxyImage.vue';
import ExternalLink from '../../components/ExternalLink.vue';

const { format } = useCurrency()
const { user } = useUser()
const { prices } = usePrices()

defineProps<{ value: number }>()

const alphPrice = computed(() => prices.tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq)

const nfts = computed(() => {
    return user.nfts
        .filter(a => Boolean(a.nft?.image))
        .sort((a, b) => {
            const floor = Number(b.nft.collection.floor - a.nft.collection.floor)
            if (floor !== 0) {
                return floor
            }

            return a.nft?.name.localeCompare(b.nft?.name)
        })
})
</script>

<template>

    <details open class="[&_svg.icon]:open:-rotate-180">
        <summary class="px-4 list-none flex items-center">
            <ChevronDownIcon class="w-4 mb-1 mr-2 icon" />
            NFTs <span class="px-2 text-calypso-500">{{ format(value) }}</span>
        </summary>

        <!-- TODO: Ranked by Rarest+Highest Floor -->
        <!-- Only show first 4 or 8 -->
        <ul class="grid grid-cols-2 md:grid-cols-4 flex-wrap gap-2 px-4 pt-4 w-full" v-if="nfts.length">
            <li class="flex flex-col gap-1 bg-zinc-300 dark:bg-calypso-900 p-2 rounded shadow" v-for="balance in nfts">
                <ProxyImage class="w-full h-32 shadow-lg object-cover rounded mb-3" :src="balance.nft.image"
                    :width="300" :height="300" />
                <div class="truncate">{{ balance.nft.name }}</div>
                <div class="text-sm flex items-center justify-between leading-3">
                    <div class="text-xs opacity-50">Ranked:</div>
                    <div class="font-bold">---</div>
                </div>
                <div class="text-sm flex items-center justify-between leading-3">
                    <div class="text-xs opacity-50">Floor:</div>
                    <div class="text-calypso-700 dark:text-calypso-500 font-bold">
                        {{ format(Number(balance.nft.collection.floor) / 1e18 * alphPrice) }}
                    </div>
                    <!-- <div class="font-bold">---</div> -->
                </div>
                <div class="text-sm flex items-center justify-between leading-3">
                    <div class="text-xs opacity-50">Listed:</div>
                    <div class="font-bold">---</div>
                </div>

                <ExternalLink :href="`https://deadrare.io/nft/${balance.nft.address}`">
                    DeadRare
                </ExternalLink>

            </li>
        </ul>
    </details>
</template>