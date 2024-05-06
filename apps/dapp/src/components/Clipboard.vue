<script setup lang="ts">
import { ClipboardDocumentCheckIcon, ClipboardDocumentListIcon } from '@heroicons/vue/24/outline';
import { ref } from 'vue';

const props = defineProps<{ text: string }>()

const copied = ref(false)

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(props.text);
    copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 300)
  } catch (error) {
    if (error && typeof error === 'object' && 'message' in error) {
      console.error(error.message);
    } else {
      console.error(error)
    }
  }
}
</script>

<template>
  <button @click="copyToClipboard">
    <ClipboardDocumentCheckIcon v-if="copied" />
    <ClipboardDocumentListIcon v-else />
  </button>
</template>
