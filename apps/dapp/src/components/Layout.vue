<script lang=ts setup>
import SideBar from './SideBar.vue';
import TopBar from './TopBar.vue';
</script>

<template>
    <div class="flex">
        <SideBar class="flex-1" />
        <!-- <div class="flex-1 min-h-full bg-calypso-300 dark:bg-calypso-950 flex flex-col"> -->
        <div class="dark:bg-calypso-950 flex-1 min-h-full flex flex-col">
            <TopBar />
            <div class="dark:border-calypso-800 flex-1 border-l">
                <slot />
            </div>
        </div>
    </div>
</template>
