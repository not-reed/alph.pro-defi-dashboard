<script setup lang="ts">
import { QuestionMarkCircleIcon } from '@heroicons/vue/24/outline';
import { computed, onMounted, ref } from 'vue';
import ExternalLink from '../../components/ExternalLink.vue';
const tokens = ref([])
onMounted(async () => {
    const results = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/tokens`, { credentials: 'include' }).then(a => a.json())
    tokens.value = results.tokens
})

const verified = computed(() => tokens.value.filter((token: any) => token.verified))
const unverified = computed(() => tokens.value.filter((token: any) => !token.verified).sort((a, b) => a.symbol.localeCompare(b.symbol)))
</script>
<template>
    <div class="flex flex-col gap-8 p-4 max-w-4xl">
        <div>

            <div class="text-xl font-bold">
                Verified Tokens
            </div>
            <ul class="flex flex-col gap-2">
                <li class="flex gap-2 w-full bg-zinc-300 dark:bg-calypso-900 p-2 font-bold rounded">
                    <div class="w-6 h-6 rounded-full " />
                    <div class="w-64">Name</div>
                    <div class="w-24">Symbol</div>
                    <div class="w-20">Decimals</div>

                    <div>
                        Explorer
                    </div>
                </li>
                <li v-for="token in verified" class="flex gap-2 w-full bg-zinc-300 dark:bg-calypso-900 p-2 rounded">
                    <img :src="token.logo" class="w-6 h-6 rounded-full " />
                    <div class="w-64">{{ token.name }}</div>
                    <div class="w-24">{{ token.symbol }}</div>
                    <div class="w-20">{{ token.decimals }}</div>

                    <ExternalLink :href="`https://explorer.alephium.org/addresses/${token.address}`" class="max-w-48">
                        {{ token.address.slice(0, 6) }}...{{ token.address.slice(-6) }}
                    </ExternalLink>
                </li>
            </ul>
        </div>

        <div>

            <div class="text-xl font-bold">Unverified Tokens</div>
            <ul class="flex flex-col gap-2">
                <li class="flex gap-2 w-full bg-zinc-300 dark:bg-calypso-900 p-2 font-bold rounded">
                    <div class="w-6 h-6 rounded-full " />
                    <div class="w-64">Name</div>
                    <div class="w-24">Symbol</div>
                    <div class="w-20">Decimals</div>

                    <div>
                        Explorer
                    </div>
                </li>
                <li v-for="token in unverified" class="flex gap-2 w-full bg-zinc-300 dark:bg-calypso-900 p-2 rounded">
                    <QuestionMarkCircleIcon class="w-6 h-6 rounded-full" />
                    <div class="w-64">{{ token.name }}</div>
                    <div class="w-24">{{ token.symbol }}</div>
                    <div class="w-20">{{ token.decimals }}</div>

                    <ExternalLink :href="`https://explorer.alephium.org/addresses/${token.address}`" class="max-w-48">
                        {{ token.address.slice(0, 6) }}...{{ token.address.slice(-6) }}
                    </ExternalLink>
                </li>
            </ul>
        </div>
    </div>
</template>
