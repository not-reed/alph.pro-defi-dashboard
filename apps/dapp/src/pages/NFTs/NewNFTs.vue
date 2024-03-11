<script setup lang="ts">
import { onMounted, ref } from 'vue';
import ProxyImage from '../../components/ProxyImage.vue';

const nfts = ref([])

onMounted(async () => {
    const results = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/nfts`, { credentials: 'include' }).then(a => a.json())
    nfts.value = results.nfts
})

function getLink(nft) {
    return `https://deadrare.io/collection/${nft.name.toLowerCase().replace(/ /g, '-')}`
}


</script>

<template>
    <div>
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

                    <div class="flex flex-col">

                        <div>{{ nft.address.slice(0, 6) }}...{{ nft.address.slice(-6) }}</div>
                        <a :href="`https://explorer.alephium.org/addresses/${nft.address}`" target="_blank"
                            class="text-calypso-500 cursor-pointer">
                            Explorer
                        </a>


                        <a :href="getLink(nft)" target="_blank" class="text-calypso-500 cursor-pointer">
                            DeadRare
                        </a>
                    </div>
                </div>
            </li>
        </ul>

    </div>
</template>
