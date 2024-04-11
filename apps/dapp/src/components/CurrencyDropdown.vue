<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { ChevronDownIcon } from '@heroicons/vue/24/solid'
import { useCurrency } from '../hooks/useCurrency';
import { type UnwrapRef, computed } from 'vue';
const { currency, exchangeRates, setCurrency } = useCurrency()


const fiats = computed(() => {
  return Object.keys(exchangeRates.value).filter((key) => !['BTC', 'ETH', 'ALPH'].includes(key)) as (keyof typeof exchangeRates.value)[]
})

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
      <MenuItems
        class="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-zinc-300 dark:bg-calypso-800 focus:outline-none">
        <div class="py-1  max-h-[50vh] overflow-auto">
          <div class="border-b border-calypso-500 border-opacity-50">
            <div class="w-full text-center opacity-50">Crypto</div>
            <MenuItem v-slot="{ active }">
            <button type="button" @click="setCurrency('BTC')"
              :class="[active ? 'bg-gray-100 text-gray-900' : 'text-zinc-800 dark:text-zinc-200', 'dark:hover:text-zinc-100 block px-4 py-2 text-sm w-full dark:hover:bg-calypso-700']">BTC</button>
            </MenuItem>
            <MenuItem v-slot="{ active }">
            <button type="button" @click="setCurrency('ETH')"
              :class="[active ? 'bg-gray-100 text-gray-900' : 'text-zinc-800 dark:text-zinc-200', 'dark:hover:text-zinc-100 block px-4 py-2 text-sm w-full dark:hover:bg-calypso-700']">ETH</button>
            </MenuItem>
            <MenuItem v-slot="{ active }">
            <button type="button" @click="setCurrency('ALPH')"
              :class="[active ? 'bg-gray-100 text-gray-900' : 'text-zinc-800 dark:text-zinc-200', 'dark:hover:text-zinc-100 block px-4 py-2 text-sm w-full dark:hover:bg-calypso-700']">ALPH</button>
            </MenuItem>
          </div>

          <div class=" pt-2">
            <div class="w-full text-center opacity-50">Fiat</div>

            <MenuItem v-slot="{ active }" v-for="fiat in fiats">
            <button type="button" @click="setCurrency(fiat)"
              :class="[active ? 'bg-gray-100 text-gray-900' : 'text-zinc-800 dark:text-zinc-200', 'dark:hover:text-zinc-100 block px-4 py-2 text-sm w-full dark:hover:bg-calypso-700']">{{
              fiat }}</button>
            </MenuItem>
          </div>

        </div>
      </MenuItems>
    </transition>
  </Menu>
</template>
