<template>
    <BubbleContainer :fromMe="lastEdit.by?.isMe">
      <BubbleBody>{{ msg.text }}</BubbleBody>
      <BubbleInfo :by="lastEdit.by?.profile?.name" :madeAt="lastEdit.madeAt" />
    </BubbleContainer>
  </template>
  
  <script lang="ts">
import { computed, defineComponent } from "vue";
import BubbleBody from "./BubbleBody.vue";
import BubbleContainer from "./BubbleContainer.vue";
import BubbleInfo from "./BubbleInfo.vue";

export default defineComponent({
  name: "ChatBubble",
  components: {
    BubbleContainer,
    BubbleBody,
    BubbleInfo,
  },
  props: {
    msg: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    const lastEdit = computed(() => props.msg._edits.text);
    return {
      lastEdit,
    };
  },
});
</script>
  