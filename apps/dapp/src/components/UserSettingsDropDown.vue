<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import UserAvatar from './UserAvatar.vue';

import { useRouter } from 'vue-router';
import { useUser } from '../hooks/useUser';

import { useDiscordAccount } from '../hooks/useDiscordAccount';
import { useAccount, useConnect } from '@alphpro/web3-vue';
import ConnectModal from './ConnectModal.vue';
import { ref } from 'vue';

const { account } = useAccount()
const { disconnect } = useConnect()
const { resetUser } = useUser()
const { signOut, signIn, session } = useDiscordAccount()
const router = useRouter()

async function disconnectWallet() {
    try {
        await disconnect()
    } catch { }

    await signOut()
    resetUser()
    router.push('/')
}

const connectModalIsOpen = ref(false)
</script>

<template>
    <Menu as="div" class="relative inline-block text-left">
        <div>
            <MenuButton class="h-6 w-6 overflow-hidden flex items-center justify-center rounded-full"
                :class="account.address ? 'border-2 border-emerald-500' : ''">
                <UserAvatar class="h-12 w-8 rounded-full" />
            </MenuButton>
        </div>

        <transition enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0 scale-95" enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75" leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95">
            <MenuItems
                class="absolute right-0 w-64 z-10 mt-2 origin-top-right rounded-md bg-calypso-800 focus:outline-none">
                <div class="py-1">
                    <!-- Display Name -->
                    <MenuItem as="span" v-slot="{ active }" v-if="session?.user?.name || account.address">
                    <div v-if="session?.user?.name"
                        class="dark:hover:text-zinc-100 block px-4 py-2 text-sm w-full dark:hover:bg-calypso-700 text-center text-zinc-200">
                        {{ session.user.name }}
                    </div>
                    <button type="button" v-else-if="account.address"
                        :class="[active ? 'bg-gray-100 text-gray-900' : 'text-zinc-200', 'dark:hover:text-zinc-100 block px-4 py-2 text-sm w-full dark:hover:bg-calypso-700']">
                        {{ account.address.slice(0, 8) }}...{{ account.address.slice(-8) }}
                    </button>
                    </MenuItem>

                    <!-- Discord Connection -->
                    <MenuItem as="span" v-slot="{ active }">
                    <button type="button" @click="disconnectWallet" v-if="session?.user?.name"
                        :class="[active ? 'bg-gray-100 text-gray-900' : 'text-zinc-200', 'dark:hover:text-zinc-100 block px-4 py-2 text-sm w-full dark:hover:bg-calypso-700']">
                        Sign Out
                    </button>
                    <button type="button" @click="signIn" v-else
                        :class="[active ? 'bg-gray-100 text-gray-900' : 'text-zinc-200', 'dark:hover:text-zinc-100 block px-4 py-2 text-sm w-full dark:hover:bg-calypso-700']">
                        Connect Discord
                    </button>
                    </MenuItem>

                    <!-- Wallet Connection -->
                    <MenuItem as="span" v-slot="{ active }">
                    <button type="button" @click="disconnect" v-if="account.address"
                        :class="[active ? 'bg-gray-100 text-gray-900' : 'text-zinc-200', 'dark:hover:text-zinc-100 block px-4 py-2 text-sm w-full dark:hover:bg-calypso-700']">
                        Disconnect Wallet
                    </button>
                    <button type="button" v-else @click="connectModalIsOpen = true"
                        :class="[active ? 'bg-gray-100 text-gray-900' : 'text-zinc-200', 'dark:hover:text-zinc-100 block px-4 py-2 text-sm w-full dark:hover:bg-calypso-700']">
                        Connect Wallet
                    </button>
                    </MenuItem>
                </div>
            </MenuItems>
        </transition>
    </Menu>

    <ConnectModal :open="connectModalIsOpen" @close="connectModalIsOpen = false" />
</template>
