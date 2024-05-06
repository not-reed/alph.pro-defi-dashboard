<script setup lang="ts">
import { computed } from 'vue';
import { useUser } from '../hooks/useUser';

const props = defineProps({
    to: { type: String, required: true },
    label: { type: String, required: true },
})

const { user } = useUser()

const withParams = computed(() => {
    return {
        '/portfolio/overview/:address?': `/portfolio/overview/${user.wallet}`,
        '/tokens/holders/:address?': "/tokens/holders",
    } as Record<string, string>
})

const target = computed(() => {
    return props.to in withParams.value ? withParams.value[props.to] : props.to
})
</script>

<template>
    <RouterLink class="hover:underline" :to="target" v-if="!to.startsWith('http')">{{ label }}
    </RouterLink>
    <a class="hover:underline" :href="to" target="_blank" v-else>{{ label }}</a>
</template>
