<script setup lang="ts">
import Glass from './components/Glass.vue'
import Slot from './components/Slot.vue'
</script>

<template>
  <div
    style="display: flex; flex-direction: column;align-items: center; justify-content: flex-end; min-height: 100dvh; width: 100vw;">
    <div class="honk-font"
      style="color: black; font-weight: bold; font-size: 4rem; text-align: center; line-height: 0.8; padding-bottom: 1rem; ">
      Alephium Vending Machine
    </div>
    <div class="machine_body"
      style="display: flex; flex-direction: column; align-items: stretch; justify-content: space-between; height: 100%; max-height: 900px;">

      <div style="display: flex; flex-direction: column; gap: 0rem; padding: 1rem; z-index: 4;">
        <Glass style="position: relative; " :labelIndex="[0, 1, 2, 3, 4]" />
        <Glass style="position: relative;" :labelIndex="[5, 6, 7, 8, 9]" />
        <Glass style="position: relative;" :labelIndex="[10, 11, 12, 13, 14]" />
        <Glass style="position: relative;" :labelIndex="[15, 16, 17, 18, 19]" />
      </div>

      <Slot />
    </div>
  </div>
</template>

<style lang=scss>
$t: transparent;
$teal: #54D9D1;
$dteal: #43ada7;
$pink: #F27A9B;
$orange: #EB7131;
$do: #d96d8b;
$bk: #fff;
$ddteal: #29b88c;

@mixin for-phone-only {
  @media (max-width: 599px) {
    @content;
  }
}

@mixin for-tablet-portrait-up {
  @media (min-width: 600px) {
    @content;
  }
}

@mixin for-tablet-landscape-up {
  @media (min-width: 900px) {
    @content;
  }
}

@mixin for-desktop-up {
  @media (min-width: 1200px) {
    @content;
  }
}

@mixin for-big-desktop-up {
  @media (min-width: 1800px) {
    @content;
  }
}

* {
  margin: 0;
  box-sizing: border-box;
}

body {
  overflow: hidden;
  font-size: 1.3vmin;
  --units: 1.5vmax;
  --brick1: #F6E2C3;
  --brick2: #F6E2C3;
  --lines: silver;
  --gp-ln: 50%/calc(var(--units) * 10) calc(var(--units) * 5);
  --gp-cn: 50%/calc(var(--units) * 5) calc(var(--units) * 5);
  height: 100vh;
  background:
    repeating-conic-gradient(from 90deg at 95% 55%, var(--lines) 0% 25%, #fff0 0% 100%) var(--gp-cn),
    repeating-linear-gradient(180deg, var(--lines) 0 5%, #fff0 0 50%, var(--lines) 0 55%, var(--brick2) 0 100%) var(--gp-ln),
    repeating-linear-gradient(90deg, var(--brick1) 0 47.5%, var(--lines) 0 50%, var(--brick1) 0 97.5%, var(--lines) 0 100%) var(--gp-ln);

  @include for-phone-only {}
}

.machine_body {
  box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px,
    rgba(0, 0, 0, 0.24) 0px 3px 8px inset;

  @include for-phone-only {
    height: 87em;
  }

  width: 70em;
  height: 82em;
  max-width: 550px;
  max-height: 850px;
  border-radius: 7px;
  background: $dteal;
  background-repeat: no-repeat;
}
</style>
