<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Layout from './components/Layout.vue'
import { useAlephiumConnect } from './hooks/useAlephiumConnect';
import { useAlephiumAccount } from './hooks/useAlephiumAccount';
import { useRoute, useRouter } from 'vue-router';
import { useUser } from './hooks/useUser';
import { useDiscordAccount } from './hooks/useDiscordAccount';

const { autoConnect } = useAlephiumConnect()
const { account } = useAlephiumAccount()
const { setWallet } = useUser()
const { loadSession, setLoaded } = useDiscordAccount()
const router = useRouter()
const route = useRoute()
const loaded = ref(false)
onMounted(async () => {
  let wallet = ''
  try {
    await loadSession()
    const response: any = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/wallets`, { credentials: 'include' }).then(a => a.json())
    if (response.wallets[0]?.address) {
      wallet = response.wallets[0].address
      setWallet(response.wallets[0].address)
    }
  } catch {
    setLoaded()
  }

  try {
    await autoConnect()
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
  <Layout>
    <RouterView v-if="loaded" />
  </Layout>
</template>./hooks/useAlephiumAccount
