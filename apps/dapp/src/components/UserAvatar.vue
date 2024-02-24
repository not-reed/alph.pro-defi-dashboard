<script setup lang=ts>
import { useUser } from '../hooks/useUser';
const { user } = useUser()
</script>

<template>
    <img
        :src="`https://kawaii-avatar.now.sh/api/avatar?username=${user.wallet}&type=Planet&mood=blissful,lovestruck,happy,excited&background=%23000000`" />
</template>
