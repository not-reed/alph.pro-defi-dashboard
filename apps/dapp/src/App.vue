<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Layout from './components/Layout.vue'
import ModalManager from './components/ModalManager.vue';
import { useConnect } from './hooks/useConnect';
import { useAccount } from './hooks/useAccount';
import { useRouter } from 'vue-router';
import { useUser } from './hooks/useUser';
import { useDiscord } from './hooks/useDiscord';

const { autoConnect } = useConnect()
const { account } = useAccount()
const { setWallet } = useUser()
const { loadSession } = useDiscord()
const router = useRouter()
const loaded = ref(false)
onMounted(async () => {
  try {
    await loadSession()
  } catch { }
  try {
    await autoConnect()
    setWallet(account.address)
    await router.push('/portfolio/overview')
  } finally {
    loaded.value = true
  }
})
</script>

<template>
  <Layout>
    <RouterView v-if="loaded" />
  </Layout>
  <ModalManager />
</template>

