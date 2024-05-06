<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { ExclamationCircleIcon  } from '@heroicons/vue/24/solid';
import { ref } from 'vue';
import { useDiscordAccount } from '../hooks/useDiscordAccount';

const show = ref(true)

const { subscription } = useDiscordAccount()

function hideNotification() {
    show.value = false
}
</script>

<template>
    <section class="flex items-center p-4 w-screen md:w-auto md:max-w-2xl" v-if="show && !subscription?.expires">
        <div
            class="relative p-4 gap-4 bg-gradient-to-br from-calypso-600 to-emerald-400 border-b-2 border-b-orange-500 flex items-center rounded shadow-xl text-lg font-bold">
            <button class="absolute top-0 right-0" @click="hideNotification">
                <XMarkIcon class="h-8 text-calypso-900" />
            </button>
            <ExclamationCircleIcon class="h-20 text-orange-600 drop-shadow hidden md:inline-flex" />
            <div class="text-calypso-900">
                Heads up! We are switching to a subscription
                model so that we can continue to offer the same great service in a sustainable way. Thanks so much for
                your support! <br /> For more information, please visit <RouterLink to="/pricing"
                    class="underline italic">
                    Pricing
                </RouterLink>
            </div>
        </div>
    </section>
</template>
