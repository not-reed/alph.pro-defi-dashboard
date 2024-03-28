<script setup lang=ts>
import SideBarDropDown from './SideBarDropDown.vue'
import SideBarDropDownLink from './SideBarDropDownLink.vue'
import { useNavLinks } from '../hooks/useNavLinks'
import Icon from './Icon.vue'

const { links } = useNavLinks()
</script>

<template>
    <nav class="dark:bg-calypso-900 shadow-xl dark:text-calypso-300 bg-gray-200 h-dvh max-w-48 sticky top-0">

        <RouterLink to="/" class="text-2xl flex items-center justify-center py-4 px-2">
            <svg class="w-6 h-6 -mt-3" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="310.5"
                height="352.4" viewBox="0 0 82.2 93.2">
                <path fill="currentColor" d="M0 93.2 41 0l41.2 93.1H27.6l6.2-14 28.2.1-21-47.8-27.2 61.8z" />
            </svg>

            lph.Pro
        </RouterLink>

        <ul class="text-sm flex flex-col gap-2">
            <li class="pb-2 px-4 first:border-b-0 border-b border-emerald-200 border-opacity-25"
                v-for="link in links.filter(a => !a.meta?.hide)">
                <div class="5" v-if="link.name && link.path && !link.children?.length">
                    <RouterLink :to="link.path">
                        <div class="">
                            {{ link.name }}
                        </div>
                    </RouterLink>
                </div>

                <SideBarDropDown v-else-if="link.children" :open="link.meta?.defaultOpen">
                    <template #summary>
                        <div>{{ link.name }}</div>

                    </template>

                    <ul class="p-1 flex flex-col gap-2 font-semibold">

                        <li v-for=" child in link.children.filter(l => !l.meta?.hide)"
                            class="inline-flex gap-1 [&_svg.icon]:hover:-rotate-12"
                            :class="child.meta?.disabled ? 'opacity-50 cursor-not-allowed' : ''">
                            <Icon :name="child.meta?.icon" :class="child.meta?.disabled ? 'pointer-events-none' : ''" />
                            <SideBarDropDownLink v-if="typeof child.name === 'string'" :to="child.path"
                                :class="child.meta?.disabled ? 'pointer-events-none' : ''"
                                :label="(child.meta?.title as string ?? child.name)" />
                        </li>
                    </ul>
                </SideBarDropDown>
            </li>
        </ul>
    </nav>
</template>
