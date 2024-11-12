<template>
  <div
    class="rounded-2xl text-sm line-clamp-10 text-ellipsis bg-white max-w-full whitespace-pre-wrap dark:bg-stone-700 dark:text-white py-1 px-3 shadow-sm"
  >
    <slot></slot>
  </div>
</template>

<script lang="ts">
export default {
  name: "BubbleBody",
};
</script>
