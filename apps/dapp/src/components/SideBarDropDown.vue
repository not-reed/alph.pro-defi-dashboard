<template>
    <details class="[&_svg.dropdown-arrow]:open:-rotate-180 border-emerald-200 border-opacity-25">
        <summary class="flex items-center justify-between gap-2">
            <div>
                <slot name="summary" />
            </div>
            <div>
                <!-- notice here, we added our own triangle/arrow svg -->
                <svg class="rotate-0 transform transition-all duration-300 dropdown-arrow" fill="none" height="20"
                    width="20" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    viewBox="0 0 24 24">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </div>
        </summary>
        <slot />
    </details>
</template>
