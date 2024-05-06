<script setup lang="ts">
import { computed, ref } from 'vue';
import MonthDropdown from './MonthDropdown.vue';    
import { AlephiumConnect, AlephiumExecute, useAccount } from '@alphpro/web3-vue';
import {  Subscribe } from '@repo/order-contracts/artifacts/ts'
import { useToast } from 'vue-toastification';
import NProgress from "nprogress";
import { useDiscordAccount } from '../../hooks/useDiscordAccount';
import ConnectModal from '../ConnectModal.vue'

const toast = useToast();
const { subscription, signWallet, wallets } = useDiscordAccount()
const { account } = useAccount()

const userSubscription = ref(1)
const priceInAlph = 5

const ONE_MONTH_IN_MS = 2628000000n as const;

const BASE_PRICE_PER_MONTH = 5n * 10n ** 18n;
const PRICE_PER_MS = BASE_PRICE_PER_MONTH / ONE_MONTH_IN_MS;

const fields = computed(() => ({
    initialFields: {
        // orderManager: 'wFuF4KgTCXRmpjn7panP2Mimk7B1MLkYXeGDTNy8ahsu'
        orderManager: '26284bc583e406680ff21775fa5938aff5613db4d8627ef1670179b6c8c8e900',
        duration: (ONE_MONTH_IN_MS * BigInt(userSubscription.value))
    },
    attoAlphAmount: PRICE_PER_MS * (ONE_MONTH_IN_MS * BigInt(userSubscription.value)),
}))

function handleNewTransaction(txHash: string) {
    NProgress.start()
    toast.info(`Subscription Transaction Submitted ${txHash}`, {
        onClick: () => window.open(`https://explorer.alephium.org/transactions/${txHash}`, '_blank')
    })
  }
  function handleConfirmedTransaction(txHash: string) {
    NProgress.done()
    toast.info("Subscription Confirmed. Thank you!", {
        onClick: () => window.open(`https://explorer.alephium.org/transactions/${txHash}`, '_blank')
    })
  }
  function handleFailedTransaction(e: Error) {
    console.log(e )
    toast.error("Something went wrong. Try again, or reach out if you need support.", {
        onClick: () => window.open("https://twitter.com/AlphDotPro", '_blank')
    })
  }
const connectModalIsOpen = ref(false)
const isVerified = computed(() => wallets.value.find(w => w.address === account.address)?.verified)
</script>

<template>
    <div class="flex">
        <div class="flex flex-col gap-4 dark:bg-calypso-900 rounded p-4 w-full">
            <div class="underline">Subscription</div>

            <div class="flex gap-2">
                Expires:
                <span class="text-emerald-500"
                    v-if="subscription.expires">{{subscription.expires.toLocaleDateString()}}</span>
                <span class="text-red-500" v-else>No Active Subscription</span>
            </div>


            <hr />
            <AlephiumExecute :txScript="Subscribe" :fields="fields" v-slot="{ execute }"
                @txInitiated="handleNewTransaction" @txConfirmed="handleConfirmedTransaction"
                @txFailed="handleFailedTransaction">
                <form @submit.prevent="execute"
                    class="flex md:items-center md:justify-between gap-4 flex-col md:flex-row">
                    <MonthDropdown v-model="userSubscription" />
                    <div>
                        <span class="opacity-50">@ {{ priceInAlph }} ALPH/Month =</span> {{ userSubscription *
                        priceInAlph
                        }} ALPH
                    </div>
                    <AlephiumConnect v-slot="{ isConnected }">
                        <button type="button" class="bg-emerald-500 rounded py-2 px-4 text-calypso-900"
                            v-if="!isConnected" @click="connectModalIsOpen = true">
                            Connect
                        </button>
                        <button type="button" class="bg-emerald-500 rounded py-2 px-4 text-calypso-900"
                            v-else-if="!isVerified" @click="signWallet">
                            Verify
                        </button>
                        <button type="submit" class="bg-emerald-500 rounded py-2 px-4 text-calypso-900" v-else>
                            Add Time
                        </button>
                    </AlephiumConnect>
                </form>
            </AlephiumExecute>
        </div>
    </div>


    <ConnectModal :open="connectModalIsOpen" @close="connectModalIsOpen = false" />
</template>
