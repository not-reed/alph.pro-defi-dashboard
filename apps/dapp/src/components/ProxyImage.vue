<script setup lang=ts>
import { computed } from 'vue'
import { proxyImage } from '../utils/images';
const props = defineProps(['src', 'width', 'height'])
const proxySrc = computed(() => proxyImage(props.src, props.width || 0, props.height || 0))
</script>

<template>
    <img :src="proxySrc" />
</template>
