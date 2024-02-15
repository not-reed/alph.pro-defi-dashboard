<script lang=ts setup>
import SideBar from './SideBar.vue';
import TopBar from './TopBar.vue';
</script>

<template>
    <div class="flex">
        <SideBar class="flex-1" />
        <div class="flex-1">
            <TopBar />
            <div>
                <slot />
            </div>
        </div>
    </div>
</template>
