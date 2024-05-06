<script setup lang=ts>
import { icons } from '../utils/icons'

interface Props {
    name: keyof typeof icons | undefined
    tailwind?: string
}
withDefaults(defineProps<Props>(), {
    name: undefined,
    tailwind: 'w-4 h-4',
})


</script>

<template>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
        class="icon transition" :class="tailwind" v-if="name" v-html="icons[name]">
    </svg>
</template>
