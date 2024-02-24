<script setup lang="ts">
import { useModals } from '../hooks/useModals'

const { modals, hasModals, popModal, modalComponents } = useModals()

</script>

<template>
    <Transition name="fade">
        <div v-if="hasModals" @click.self="popModal"
            class="bg-zinc-800 bg-opacity-50 z-index-50 fixed top-0 bottom-0 left-0 right-0 flex items-center justify-center">
            <div class="bg-calypso-800 p-4 rounded-xl" v-for="modal in modals">
                <component :is="modalComponents[modal]" @close="popModal" />
            </div>
        </div>
    </Transition>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
