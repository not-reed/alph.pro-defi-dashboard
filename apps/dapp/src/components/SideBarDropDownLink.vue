<script setup lang="ts">
defineProps({
    to: { type: String, required: true },
    label: { type: String, required: true },
})
</script>

<template>
    <router-link :to="to">{{ label }}</router-link>
</template>
