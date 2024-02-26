<script setup lang="ts">
defineProps({
    to: { type: String, required: true },
    label: { type: String, required: true },
})
</script>

<template>
    <RouterLink class="hover:underline" :to="to" v-if="!to.startsWith('http')">{{ label }}</RouterLink>
    <a class="hover:underline" :href="to" v-else>{{ label }}</a>
</template>
