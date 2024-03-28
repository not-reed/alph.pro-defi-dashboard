<script setup lang="ts">
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline';
defineProps(['href'])
</script>
<template>
    <a :href="href" target="_blank"
        class="text-calypso-700 dark:text-calypso-500 cursor-pointer flex items-center justify-between md:gap-2 w-full">
        <slot />

        <ArrowTopRightOnSquareIcon class="w-4 h-4 mb-1" />
    </a>
</template>
