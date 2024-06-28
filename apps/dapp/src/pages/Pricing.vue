<script setup lang="ts">
import { CheckBadgeIcon } from '@heroicons/vue/24/outline';
import { useDiscordAccount } from '../hooks/useDiscordAccount';
import { useRouter } from 'vue-router';


const { signIn, session } = useDiscordAccount()

const router = useRouter()

async function signUp() {
    await signIn()
    router.push('/settings')
}
</script>

<template>
    <div class="flex grow max-w-2xl flex-col justify-center">
        <div class="flex gap-4 p-4 w-full h-min flex-col-reverse md:flex-row">
            <div
                class="bg-gradient-to-br from-calypso-700 to-emerald-700 p-8 rounded-lg shadow-xl flex flex-col gap-8 flex-1 justify-between">
                <div class="flex flex-col gap-8">
                    <div class="text-2xl font-bold underline text-center">
                        Free
                    </div>
                    <ul class="text-xl flex flex-col gap-2 opacity-75">
                        <li class="flex gap-2">
                            <CheckBadgeIcon class="h-6 w-6" /> Total Wallet Value
                        </li>
                        <li class="flex gap-2">
                            <CheckBadgeIcon class="h-6 w-6" /> Total Pool Value
                        </li>
                        <li class="flex gap-2">
                            <CheckBadgeIcon class="h-6 w-6" /> Total Staking Value
                        </li>
                        <li class="flex gap-2">
                            <CheckBadgeIcon class="h-6 w-6" /> Total NFT Value
                        </li>
                        <li class="flex gap-2">
                            <CheckBadgeIcon class="h-6 w-6" /> Top Tokens in Wallet
                        </li>
                        <li class="flex gap-2">
                            <CheckBadgeIcon class="h-6 w-6" /> Top NFTs in Wallet
                        </li>
                    </ul>
                </div>
                <div class="flex items-center justify-center text-calypso-900 font-bold">
                    <button class="rounded bg-emerald-500 px-4 py-2" @click="signIn" v-if="!session.expires">
                        Sign up now
                    </button>
                    <RouterLink to="/settings" class="rounded bg-emerald-500 px-4 py-2" v-else>
                        Manage Subscription
                    </RouterLink>
                </div>
            </div>

            <div
                class="bg-gradient-to-br from-calypso-700 to-emerald-700 p-8 rounded-lg shadow-xl flex flex-col gap-8 flex-1 justify-between">
                <div class="flex flex-col gap-8">
                    <div class="text-2xl font-bold underline text-center">
                        Pro
                    </div>

                    <ul class="text-xl flex flex-col gap-2">
                        <li class="flex gap-2 italic font-bold">
                            <CheckBadgeIcon class="h-6 w-6" /> Everything in Free
                        </li>
                        <li class="flex gap-2">
                            <CheckBadgeIcon class="h-6 w-6" /> Multiple Wallets
                        </li>
                        <li class="flex gap-2">
                            <CheckBadgeIcon class="h-6 w-6" /> All Tokens in Wallet
                        </li>
                        <li class="flex gap-2">
                            <CheckBadgeIcon class="h-6 w-6" /> All NFTs in Wallet
                        </li>
                        <li class="flex gap-2">
                            <CheckBadgeIcon class="h-6 w-6" /> Pool Breakdowns
                        </li>
                        <li class="flex gap-2">
                            <CheckBadgeIcon class="h-6 w-6" /> Staking Breakdowns
                        </li>
                        <li class="flex gap-2">
                            <CheckBadgeIcon class="h-6 w-6" /> And More!
                        </li>
                    </ul>
                </div>
                <div class="text-xl font-bold italic text-right">
                    5 ALPH / Month
                </div>

                <div class="flex items-center justify-center text-calypso-900 font-bold">
                    <button class="rounded bg-emerald-500 px-4 py-2" @click="signUp" v-if="!session.expires">
                        Sign up now
                    </button>
                    <RouterLink to="/settings" class="rounded bg-emerald-500 px-4 py-2" v-else>
                        Manage Subscription
                    </RouterLink>
                </div>
            </div>
        </div>


        <div class="p-4 max-w-2xl w-full grow h-auto text-lg">
            <div class="bg-gradient-to-br from-calypso-700 to-emerald-700 p-8 rounded-lg shadow-xl text-center">
                To sign up for Pro, login with <button @click="signIn"
                    class="text-calypso-700 dark:text-calypso-500 font-bold underline italic">Discord</button> and
                manage
                your subscription from the <RouterLink :to="session.expires ? '/settings' : ''"
                    class="text-calypso-700 dark:text-calypso-500 font-bold underline italic">Settings</RouterLink>
                page.
            </div>
        </div>
        <div class="grow" />
    </div>
</template>
