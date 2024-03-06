<script setup lang=ts>
import { useDiscordAccount } from '../hooks/useDiscordAccount';
import { useUser } from '../hooks/useUser';
const { user } = useUser()
const { session } = useDiscordAccount()
</script>

<template>
    <img v-if="session.user.image" :src="session.user.image" class="object-contain" />
    <img v-else class="object-cover"
        :src="`https://kawaii-avatar.now.sh/api/avatar?username=${user.wallet}&type=Planet&mood=blissful,lovestruck,happy,excited&background=%23000000`" />
</template>
