<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { ChevronDownIcon } from '@heroicons/vue/24/solid'


const model = defineModel()



</script>

<template>
    <Menu as="div" class="relative inline-block text-left w-auto">
        <div class="bg-calypso-700 rounded">
            <MenuButton class="inline-flex w-full justify-center gap-x-1.5 rounded-md px-3 py-2 shadow-sm">
                {{ model === 1 ? '1 Month' : `${model} Months`}}
                <ChevronDownIcon class="-mr mt-1 h-4 w-4 text-gray-400" aria-hidden="true" />
            </MenuButton>
        </div>

        <transition enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0 scale-95" enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75" leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95">
            <MenuItems
                class="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-zinc-300 dark:bg-calypso-800 focus:outline-none">
                <div class="py-1  max-h-[50vh] overflow-auto">
                    <MenuItem v-slot="{ active }">
                    <button type="button" @click="model = 1"
                        :class="[active ? 'bg-gray-100 text-gray-900' : 'text-zinc-800 dark:text-zinc-200', 'dark:hover:text-zinc-100 block px-4 py-2 text-sm w-full dark:hover:bg-calypso-700']">
                        1 Month
                    </button>
                    </MenuItem>
                    <MenuItem v-slot="{ active }">
                    <button type="button" @click="model = 3"
                        :class="[active ? 'bg-gray-100 text-gray-900' : 'text-zinc-800 dark:text-zinc-200', 'dark:hover:text-zinc-100 block px-4 py-2 text-sm w-full dark:hover:bg-calypso-700']">
                        3 Months
                    </button>
                    </MenuItem>
                    <MenuItem v-slot="{ active }">
                    <button type="button" @click="model = 6"
                        :class="[active ? 'bg-gray-100 text-gray-900' : 'text-zinc-800 dark:text-zinc-200', 'dark:hover:text-zinc-100 block px-4 py-2 text-sm w-full dark:hover:bg-calypso-700']">
                        6 Months
                    </button>
                    </MenuItem>

                    <!-- <MenuItem v-slot="{ active }">
                    <button type="button" @click="model = 12"
                        :class="[active ? 'bg-gray-100 text-gray-900' : 'text-zinc-800 dark:text-zinc-200', 'dark:hover:text-zinc-100 block px-4 py-2 text-sm w-full dark:hover:bg-calypso-700']">
                        12 Months
                    </button>
                    </MenuItem> -->
                </div>
            </MenuItems>
        </transition>
    </Menu>
</template>
