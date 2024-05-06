<script setup lang="ts">
import { ref } from 'vue';
import MonthDropdown from './MonthDropdown.vue';    
import { ArrowPathIcon, TrashIcon } from '@heroicons/vue/24/outline';


const expiration = ref(new Date(new Date().setMonth(new Date().getMonth() + 1)))
</script>

<template>
    <div class="flex">
        <div class="flex flex-col gap-4 dark:bg-calypso-900 rounded p-4 w-full">
            <div>API Keys</div>
            <table>
                <thead>
                    <tr class="text-left">
                        <th>Label</th>
                        <th>Expiry</th>
                        <th class="w-24">Actions</th>
                    </tr>
                </thead>
                <!-- <li>You have no API keys yet</li> -->
                <tbody>
                    <!-- <tr>
                        <td>My App 1</td>
                        <td>{{ expiration.toLocaleDateString() }}</td>
                        <td class="flex gap-4 w-24">
                            <ArrowPathIcon class="h-6 text-emerald-500" />
                            <TrashIcon class="h-6 text-red-500" />
                        </td>
                    </tr>

                    <tr>
                        <td>My App 1 (dev)</td>
                        <td>{{ expiration.toLocaleDateString() }}</td>
                        <td class="flex gap-4 w-24">
                            <ArrowPathIcon class="h-6 text-emerald-500" />
                            <TrashIcon class="h-6 text-red-500" />
                        </td>
                    </tr> -->
                </tbody>
            </table>

            <hr />
            <form @submit.prevent class="flex items-center justify-center gap-4">
                <input type="text" placeholder="Label" class="rounded p-2 grow" />
                <button type="submit" class="bg-emerald-500 rounded py-2 px-4 text-calypso-900">
                    Generate for 10 ALPH
                </button>
            </form>
        </div>
    </div>
</template>
