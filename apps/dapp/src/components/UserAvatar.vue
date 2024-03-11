<script setup lang=ts>
import { computed } from 'vue';
import { useDiscordAccount } from '../hooks/useDiscordAccount';
import { useUser } from '../hooks/useUser';
import ProxyImage from './ProxyImage.vue';

const { user } = useUser()
const { session } = useDiscordAccount()
const defaultImage = computed(() => `https://kawaii-avatar.now.sh/api/avatar?username=${user.wallet}&size=${150}&type=Planet&mood=blissful,lovestruck,happy,excited&background=%23000`)
</script>

<template>
    <ProxyImage :src="session.user.image" :width="48" :height="48" v-if="session.user.image" class="object-contain" />
    <ProxyImage :src="defaultImage" :width="48" :height="48" v-else class="object-cover" />
</template>
