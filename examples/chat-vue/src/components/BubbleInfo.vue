<template>
  <div class="text-xs text-neutral-500 mt-1.5">
    {{ by }} · {{ formattedTime }}
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";

export default defineComponent({
  name: "BubbleInfo",
  props: {
    by: {
      type: String,
      default: "",
    },
    madeAt: {
      type: Date,
      required: true,
    },
  },
  setup(props) {
    const formattedTime = computed(() => props.madeAt.toLocaleTimeString());
    return {
      formattedTime,
    };
  },
});
</script>
