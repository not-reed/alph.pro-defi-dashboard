<script setup lang=ts>
import { computed } from 'vue';
import { useNavLinks } from '../hooks/useNavLinks'
import { useRoute } from 'vue-router';
import { useUser } from '../hooks/useUser';
import Dropdown from './Dropdown.vue'
import { useDarkMode } from '../hooks/useDarkMode';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/vue/24/outline'

const { mode, nextTheme } = useDarkMode()
const route = useRoute()
const { user } = useUser()
const { links } = useNavLinks()

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
    <div class="flex bg-gray-200 border-b dark:border-calypso-800 dark:bg-calypso-900 w-full sticky top-0 z-10">
        <div class="flex items-center justify-between w-full max-w-4xl">
            <div class="" v-if="page?.name">
                <ul class="inline-flex pt-10 px- w-full -mt-8">
                    <li
                        class="dark:bg-calypso-950 bg-white dark:text-emerald-200 dark:border-calypso-800 px-2 h-8 pt-1 rounded-t border-t border-r border-l -mb-px">
                        {{ page.name }}
                    </li>

                    <template v-if="page.children">
                        <RouterLink
                            class="dark:text-calypso-400 dark:border-calypso-800 dark:hover:bg-calypso-800 dark:hover:text-calypso-200 text-zinc-500 border-zinc-300 hover:bg-calypso-300 hover:text-calypso-800 transition px-4 h-8 border-t border-r border-l pt-1 rounded-t -mb-px"
                            :to="child.path"
                            active-class="dark:border-calypso-800 dark:bg-calypso-800 border-calypso-800 bg-zinc-300  rounded-t border-t border-r border-l "
                            v-for="child in page.children">
                            <div>{{ child.meta?.title ?? child.name }}</div>
                        </RouterLink>
                    </template>
                </ul>

            </div>

            <div v-else class="">
            </div>
            <div class="mt-2 flex gap-2 -mr-4">

                <Dropdown />

                <div @click="nextTheme">
                    <SunIcon v-if="mode === 'light'" class="w-6 h-6" />
                    <MoonIcon v-if="mode === 'dark'" class="w-6 h-6" />
                    <ComputerDesktopIcon v-if="mode === 'system'" class="w-6 h-6" />
                </div>

                <!-- Settings -->
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                    stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                <div class="h-6 w-6 overflow-hidden flex items-center justify-center rounded-full">

                    <img :src="`https://kawaii-avatar.now.sh/api/avatar?username=${user.wallet}&type=Planet&mood=blissful,lovestruck,happy,excited&background=%23000000`"
                        class="h-12 w-8 rounded-full object-cover" />
                </div>
            </div>
        </div>
    </div>
</template>
