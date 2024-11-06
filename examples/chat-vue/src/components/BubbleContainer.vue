<template>
  <div :class="[alignClass, 'flex flex-col m-2']" role="row">
    <slot></slot>
  </div>
</template>

<script lang="ts">
export default {
  name: "BubbleContainer",
  props: {
    fromMe: {
      type: Boolean,
      default: undefined,
    },
  },
  computed: {
    alignClass() {
      return this.fromMe ? "items-end" : "items-start";
    },
  },
};
</script>
