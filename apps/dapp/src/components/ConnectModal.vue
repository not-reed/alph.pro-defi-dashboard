<script setup lang="ts">
import { useConnect } from '../hooks/useConnect'
import { ConnectorId } from '../utils/connectors/constants';

import { useUser } from '../hooks/useUser'
import { useRouter } from 'vue-router';
import { useAccount } from '../hooks/useAccount';

const { connect } = useConnect()
const { setWallet } = useUser()
const { account } = useAccount()

const emits = defineEmits(['close'])

const router = useRouter()

async function connectWith(id: ConnectorId) {
    await connect(id)

    setWallet(account.address)
    emits('close')
    router.push('/portfolio/overview')
}
</script>

<template>
    <div class="flex items-center flex-col gap-2">
        <div class="text-2xl">
            Alph.Pro
        </div>
        <button @click="connectWith('injected')"
            class="select-none border w-full text-xl bg-calypso-700 hover:bg-calypso-900 transition font-bold px-8 py-2 rounded-lg">
            Extension Wallet
        </button>
        <button @click="connectWith('walletConnect')"
            class="select-none border w-full text-xl bg-calypso-700 hover:bg-calypso-900 transition font-bold px-8 py-2 rounded-lg">
            Wallet Connect
        </button>
        <button @click="connectWith('desktopWallet')"
            class="hidden select-none border w-full text-xl bg-calypso-700 hover:bg-calypso-900 transition font-bold px-8 py-2 rounded-lg">
            Desktop Wallet
        </button>
    </div>
</template>
