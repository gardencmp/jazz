<template>
  <div
    class="p-3 bg-white w-full flex justify-end gap-1 text-xs border-b dark:bg-transparent dark:border-stone-800"
  >
    <slot></slot>
  </div>
</template>

<script lang="ts">
export default {
  name: "TopBar",
};
</script>
