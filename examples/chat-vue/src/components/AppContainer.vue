<template>
  <div
    class="flex flex-col justify-between w-screen h-screen bg-stone-50 dark:bg-black dark:text-white"
  >
    <slot></slot>
  </div>
</template>

<script lang="ts">
export default {
  name: "AppContainer",
};
</script>
