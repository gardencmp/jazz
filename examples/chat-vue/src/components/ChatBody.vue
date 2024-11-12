<template>
  <div class="flex-1 overflow-y-auto flex flex-col-reverse" role="application">
    <slot></slot>
  </div>
</template>

<script lang="ts">
export default {
  name: "ChatBody",
};
</script>
