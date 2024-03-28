<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import ProxyImage from '../../components/ProxyImage.vue';
import ExternalLink from '../../components/ExternalLink.vue';
import { useCurrency } from '../../hooks/useCurrency';
import { usePrices } from '../../hooks/usePrices';

interface NftCollectionRaw {
    image: string
    name: string
    description: string
    address: string
    stats: {
        holderCount: `${number}`
        listedCount: `${number}`
        mintedCount: `${number}`
        floor: `${number}`
        volume: `${number}`
    }
}

const nftResults = ref<NftCollectionRaw[]>([])

onMounted(async () => {
    const results = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/nfts`, { credentials: 'include' }).then(a => a.json())
    nftResults.value = results.nfts.filter(a => !a.listed)
})

const { format } = useCurrency()
const { prices } = usePrices()


const alphPrice = computed(() => prices.tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq)

enum SortBy {
    Name = 'Name',
    HolderCount = 'HolderCount',
    ListedCount = 'ListedCount',
    MintedCount = 'MintedCount',
    Floor = 'Floor',
    Volume = 'Volume'
}

const sortBy = ref<SortBy>(SortBy.Name)

const nfts = computed(() => nftResults.value.map(nft => ({
    ...nft,
    stats: {
        holderCount: nft.stats.holderCount,
        listedCount: nft.stats.listedCount,
        mintedCount: nft.stats.mintedCount,
        floor: format(Number(nft.stats.floor) / 1e18 * alphPrice.value),
        volume: format(Number(nft.stats.volume) / 1e18 * alphPrice.value)
    }
})).sort((a, b) => {
    switch (sortBy.value) {
        case SortBy.Name:
            return a.name.localeCompare(b.name);
        case SortBy.HolderCount:
            return Number(a.stats.holderCount) - Number(b.stats.holderCount);
        case SortBy.ListedCount:
            return Number(a.stats.listedCount) - Number(b.stats.listedCount);
        case SortBy.MintedCount:
            return Number(a.stats.mintedCount) - Number(b.stats.mintedCount);
        case SortBy.Floor:
            return Number(a.stats.floor) - Number(b.stats.floor);
        case SortBy.Volume:
            return Number(a.stats.volume) - Number(b.stats.volume);
    }
}))
</script>

<template>
    <div>
        <div>

            <div class="flex gap-4 justify-between max-w-4xl pt-4 mx-4">
                <div class="text-lg font-bold">Unlisted NFTs</div>
            </div>
        </div>

        <ul class="grid grid-cols-4 flex-wrap gap-2 mx-4 pt-4 w-full max-w-4xl">
            <li v-for="nft in nfts" class="flex flex-col gap-4 bg-zinc-300 dark:bg-calypso-900 p-2 rounded shadow">
                <div class="w-full h-32">
                    <ProxyImage :src="nft.image" :width="300" :height="300"
                        class="w-full h-32 shadow-lg object-cover rounded mb-3" />
                </div>
                <div class="flex flex-col gap-4 justify-between h-full">
                    <div class="flex flex-col">
                        <div class="text-sm flex items-center justify-between leading-3">
                            <div class="font-bold">{{ nft.name }}</div>
                        </div>
                        <div class="text-sm flex items-center justify-between leading-3">
                            <div class="text-xs">{{ nft.description }}</div>
                        </div>
                    </div>
                    <div class="flex flex-col gap-4">
                        <ul>
                            <li><span class="opacity-75">Holders:</span> {{ nft.stats.holderCount }}</li>
                            <li><span class="opacity-75">Listed:</span> {{ nft.stats.listedCount }}</li>
                            <li><span class="opacity-75">Minted:</span> {{ nft.stats.mintedCount }}</li>
                            <li><span class="opacity-75">Floor:</span> {{ nft.stats.floor }}</li>
                            <li><span class="opacity-75">Volume:</span> {{ nft.stats.volume }}</li>
                        </ul>

                        <div class="flex flex-col">
                            <div>{{ nft.address.slice(0, 6) }}...{{ nft.address.slice(-6) }}</div>
                            <ExternalLink :href="`https://explorer.alephium.org/addresses/${nft.address}`" class="">
                                Explorer
                            </ExternalLink>

                            <ExternalLink :href="`https://deadrare.io/collection-from-contract/${nft.address}`"
                                class="">
                                DeadRare
                            </ExternalLink>
                        </div>
                    </div>
                </div>
            </li>
        </ul>
    </div>
</template>
