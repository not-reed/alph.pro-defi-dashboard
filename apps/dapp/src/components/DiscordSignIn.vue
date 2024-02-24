<script lang="ts" setup>
import { signIn } from '../utils/authjs-client';



</script>

<template>
    <button class="bg-[#5865F2] flex items-center justify-center gap-2 text-white font-bold p-2 rounded-md"
        @click="() => signIn('discord')">
        <img src="https://authjs.dev/img/providers/discord.svg" alt="Discord" />
        Sign In With Discord
    </button>
</template>
