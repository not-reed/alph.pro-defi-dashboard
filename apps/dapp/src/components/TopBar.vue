<script setup lang=ts>
import { computed, onMounted } from 'vue';
import { useNavLinks } from '../hooks/useNavLinks'
import { useRoute, useRouter } from 'vue-router';


const route = useRoute()
const router = useRouter()

const { links } = useNavLinks()

onMounted(() => {
    setTimeout(() => {
        console.log({ ...page.value })
        console.log({ links, route: { ...route }, router: { ...router }, location: window.location })

    }, 0)
})
const page = computed(() => {
    if (route.path.startsWith('/portfolio')) {
        return links.find(link => link.path === '/portfolio')
    }
    if (route.path.startsWith('/defi')) {
        return links.find(link => link.path === '/defi')
    }

    if (route.path.startsWith('/tokens')) {
        return links.find(link => link.path === '/tokens')
    }
    if (route.path.startsWith('/nfts')) {
        return links.find(link => link.path === '/nfts')
    }

    return links.find(link => link.path === '/')
})


</script>
<template>
    <div class="" v-if="page">

        <ul id="tabs" class="inline-flex pt-2 px- w-full border-b border-emerald-200">
            <li
                class="bg-stone-800 px-2 text-emerald-200 font-semibold pt-1 rounded-t-lg border-emerald-200 border-t border-r border-l -mb-px">
                {{ page.name }}
            </li>

            <template v-if="page.children">

                <RouterLink class="px-4 text-emerald-500 font-semibold pt-1 rounded-t-lg" :to="child.path"
                    active-class="rounded-t-lg border-emerald-200 border-t border-r border-l bg-stone-900 "
                    v-for="child in page.children">
                    <div>{{ child.meta?.title ?? child.name }}</div>
                </RouterLink>

            </template>
        </ul>
    </div>
</template>
