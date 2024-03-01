<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Layout from './components/Layout.vue'
import ModalManager from './components/ModalManager.vue';
import { useConnect } from './hooks/useConnect';
import { useAccount } from './hooks/useAccount';
import { useRoute, useRouter } from 'vue-router';
import { useUser } from './hooks/useUser';
import { useDiscord } from './hooks/useDiscord';

const { autoConnect } = useConnect()
const { account } = useAccount()
const { setWallet } = useUser()
const { loadSession, setLoaded } = useDiscord()
const router = useRouter()
const route = useRoute()
const loaded = ref(false)
onMounted(async () => {
  let hasDiscord = false
  try {
    await loadSession()
    const response: any = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/wallets`, { credentials: 'include' }).then(a => a.json())
    if (response.wallets[0]?.address) {
      setWallet(response.wallets[0].address)
    }
    hasDiscord = true
  } catch {
    setLoaded()
  }

  let hasWallet = false
  try {
    await autoConnect()
    if (account.address) {
      setWallet(account.address)
    }

    hasWallet = true
  } catch {

  }

  if (route.name === 'Home' && (hasDiscord || hasWallet)) {
    // only redirect if logged in and on home page
    await router.push('/portfolio/overview')
  }
  loaded.value = true
})
</script>

<template>
  <Layout>
    <RouterView v-if="loaded" />
  </Layout>
  <ModalManager />
</template>

