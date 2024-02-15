<script setup lang=ts>
import SideBarDropDown from './SideBarDropDown.vue'
import SideBarDropDownLink from './SideBarDropDownLink.vue'
import { useNavLinks } from '../hooks/useNavLinks'

const { links } = useNavLinks()
</script>

<template>
    <nav class="dark:bg-stone-900 dark:text-emerald-200 bg-gray-200 min-h-dvh max-w-48">
        <div class="text-2xl flex items-center justify-center py-4 px-2 underline">
            Alph.Pro
        </div>
        <ul class="text-sm">
            <li class="py-2 px-4" v-for="link in links ">
                <div class=" border-b border-emerald-200 border-opacity-25" v-if="link.path && !link.children?.length">
                    <RouterLink :to="link.path">
                        <div class="py-4">{{
                            link.name }}</div>
                    </RouterLink>
                </div>


                <SideBarDropDown v-else-if="link.children">
                    <template #summary>
                        <div>{{ link.name }}</div>
                    </template>

                    <ul class="p-2 flex flex-col gap-2">
                        <li v-for=" child in link.children ">
                            <SideBarDropDownLink v-if="typeof child.name === 'string'" :to="child.path"
                                :label="(child.meta?.title as string ?? child.name)" />
                        </li>
                    </ul>
                </SideBarDropDown>
            </li>
        </ul>
    </nav>
</template>
e
