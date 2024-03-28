<script setup lang=ts>
import { computed } from 'vue'
import { proxyImage } from '../utils/images';
const props = defineProps(['src', 'width', 'height'])
const proxySrc = computed(() => proxyImage(props.src, props.width || 0, props.height || 0))
const isVideo = computed(() => false && props.src.endsWith('.mp4'))
</script>

<template>
    <video v-if="isVideo">
        <source :src="src">
    </video>
    <img :src="proxySrc" v-else />
</template>
