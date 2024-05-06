<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Layout from './components/Layout.vue'
import Notifications from './components/Notifications.vue'

import { useRoute, useRouter } from 'vue-router';
import { useUser } from './hooks/useUser';
import { useDiscordAccount } from './hooks/useDiscordAccount';
import { AlephiumConnectionProvider, useAccount } from '@alphpro/web3-vue';

const { account } = useAccount()
const { setWallet } = useUser()
const { loadSession, setLoaded, wallets, refreshWallets } = useDiscordAccount()
const router = useRouter()
const route = useRoute()
const loaded = ref(false)
onMounted(async () => {
  let wallet = ''
  try {
    await loadSession()
    await refreshWallets()
    const defaultWallet = wallets.value.find(w => w.isTipBot) || wallets.value[0]
    if (defaultWallet && !account.address) {
      wallet = defaultWallet.address
      setWallet(defaultWallet.address)
    }
  } catch {
    setLoaded()
  }

  try {
    if (account.address) {
      wallet = account.address
      setWallet(account.address)
    }

  } catch {

  }

  if (route.name === 'Home' && wallet) {
    // only redirect if logged in and on home page
    await router.push(`/portfolio/overview/${wallet}`)
  }
  loaded.value = true
})
</script>

<template>
  <AlephiumConnectionProvider :autoConnect="true" :group="0" network="mainnet">
    <Layout>
      <Notifications />
      <RouterView v-if="loaded" />
    </Layout>
  </AlephiumConnectionProvider>
</template>
