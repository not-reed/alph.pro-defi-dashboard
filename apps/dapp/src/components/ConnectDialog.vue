<script setup lang="ts">

import {
    TransitionRoot,
    Dialog,
    DialogPanel,
    DialogTitle,
    DialogDescription,
} from '@headlessui/vue'
import { ref } from 'vue';

const isOpen = ref(false)

function setIsOpen(value: boolean) {
    isOpen.value = value
}

</script>


<template>
    <TransitionRoot :show="isOpen" as="template" enter="duration-300 ease-out" enter-from="opacity-0" enter-to="opacity-100"
        leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0">
        <Dialog :open="isOpen" @close="setIsOpen">
            <DialogPanel>
                <DialogTitle>Deactivate account</DialogTitle>
                <DialogDescription>
                    This will permanently deactivate your account
                </DialogDescription>

                <p>
                    Are you sure you want to deactivate your account? All of your data will be
                    permanently removed. This action cannot be undone.
                </p>

                <button @click="setIsOpen(false)">Deactivate</button>
                <button @click="setIsOpen(false)">Cancel</button>
            </DialogPanel>
        </Dialog>
    </TransitionRoot>
</template>
