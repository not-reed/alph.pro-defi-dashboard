

<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { ChevronDownIcon } from '@heroicons/vue/24/solid'
import { useCurrency } from '../hooks/useCurrency';
const { currency, setCurrency } = useCurrency()
</script>

<template>
  <Menu as="div" class="relative inline-block text-left">
    <div>
      <MenuButton class="inline-flex w-full justify-center gap-x-1.5 rounded-md px-3 py-2 text-xs shadow-sm">
        {{ currency }}
        <ChevronDownIcon class="-mr -mt-px h-4 w-4 text-gray-400" aria-hidden="true" />
      </MenuButton>
    </div>

    <transition enter-active-class="transition ease-out duration-100" enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100" leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100" leave-to-class="transform opacity-0 scale-95">
      <MenuItems class="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-calypso-800 focus:outline-none">
        <div class="py-1">
          <MenuItem v-slot="{ active }">
          <button type="button" @click="setCurrency('USD')"
            :class="[active ? 'bg-gray-100 text-gray-900' : 'text-zinc-200', 'dark:hover:text-zinc-100 block px-4 py-2 text-sm w-full dark:hover:bg-calypso-700']">USD</button>
          </MenuItem>
          <MenuItem v-slot="{ active }">
          <button type="button" @click="setCurrency('BTC')"
            :class="[active ? 'bg-gray-100 text-gray-900' : 'text-zinc-200', 'dark:hover:text-zinc-100 block px-4 py-2 text-sm w-full dark:hover:bg-calypso-700']">BTC</button>
          </MenuItem>
          <MenuItem v-slot="{ active }">
          <button type="button" @click="setCurrency('ETH')"
            :class="[active ? 'bg-gray-100 text-gray-900' : 'text-zinc-200', 'dark:hover:text-zinc-100 block px-4 py-2 text-sm w-full dark:hover:bg-calypso-700']">ETH</button>
          </MenuItem>

          <MenuItem v-slot="{ active }">
          <button type="button" @click="setCurrency('ALPH')"
            :class="[active ? 'bg-gray-100 text-gray-900' : 'text-zinc-200', 'dark:hover:text-zinc-100 block px-4 py-2 text-sm w-full dark:hover:bg-calypso-700']">ALPH</button>
          </MenuItem>

        </div>
      </MenuItems>
    </transition>
  </Menu>
</template>
