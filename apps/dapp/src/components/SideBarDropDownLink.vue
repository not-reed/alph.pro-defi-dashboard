<script setup lang="ts">
defineProps({
    to: { type: String, required: true },
    label: { type: String, required: true },
})
</script>

<template>
    <router-link class="hover:underline" :to="to">{{ label }}</router-link>
</template>
