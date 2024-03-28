<script lang=ts setup>
import { CurrencyDollarIcon, HomeIcon, HomeModernIcon, PhotoIcon } from '@heroicons/vue/24/outline';
import SideBar from './SideBar.vue';
import TopBar from './TopBar.vue';
</script>

<template>
    <div class="flex mb-10 md:mb-0">
        <SideBar class="flex-1 hidden md:inline-block" />
        <!-- <div class="flex-1 min-h-full bg-calypso-300 dark:bg-calypso-950 flex flex-col"> -->
        <div class="flex-1 min-h-full flex flex-col">
            <TopBar class="hidden md:inline-block" />
            <div class="md:dark:border-calypso-800 flex-1 md:border-l">
                <slot />
            </div>
        </div>

    </div>
    <div
        class="fixed -bottom-1 bg-zinc-100 dark:bg-calypso-700 left-0 right-0 md:hidden h-8 border-t border-calypso-900">
        <ul class="flex justify-around text-calypso-800 dark:text-calypso-400">
            <li>
                <RouterLink to="/">
                    <div
                        class="bg-zinc-100 dark:bg-calypso-700 rounded-full p-2 relative -top-2 border-t border-calypso-900">
                        <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" viewBox="0 0 82.2 93.2"
                            class="w-6 h-6 p-px -top-px relative">
                            <path fill="currentColor"
                                d="M0 93.2 41 0l41.2 93.1H27.6l6.2-14 28.2.1-21-47.8-27.2 61.8z" />
                        </svg>
                    </div>
                </RouterLink>
            </li>
            <li>
                <RouterLink to="/portfolio/overview">
                    <div
                        class="bg-zinc-100 dark:bg-calypso-700 rounded-full p-2 relative -top-2 border-t border-calypso-900">
                        <HomeIcon class="w-6 h-6" />
                    </div>
                </RouterLink>
            </li>
            <li>
                <RouterLink to="/tokens/listed">
                    <div
                        class="bg-zinc-100 dark:bg-calypso-700 rounded-full p-2 relative -top-2 border-t border-calypso-900">
                        <CurrencyDollarIcon class="w-6 h-6" />
                    </div>
                </RouterLink>
            </li>
            <li>
                <RouterLink to="/nfts/listed">
                    <div
                        class="bg-zinc-100 dark:bg-calypso-700 rounded-full p-2 relative -top-2 border-t border-calypso-900">
                        <PhotoIcon class="w-6 h-6" />
                    </div>
                </RouterLink>
            </li>
        </ul>
    </div>
</template>
