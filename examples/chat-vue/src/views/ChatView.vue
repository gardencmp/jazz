<template>
  <div v-if="chat">
    <ChatBody>
      <template v-if="chat.length > 0">
        <ChatBubble
          v-for="msg in displayedMessages"
          :key="msg.id"
          :msg="msg"
        />
      </template>
      <EmptyChatMessage v-else />
      <button
        v-if="chat.length > showNLastMessages"
        class="px-4 py-1 block mx-auto my-2 border rounded"
        @click="showMoreMessages"
      >
        Show more
      </button>
    </ChatBody>
    <ChatInput @submit="handleSubmit" />
  </div>
  <div v-else class="flex-1 flex justify-center items-center">
    Loading...
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, type PropType } from 'vue';
import type { ID } from 'jazz-tools';
import { Chat, Message } from '../schema';
import { useCoState } from '../main';
import ChatBody from '../components/ChatBody.vue';
import ChatInput from '../components/ChatInput.vue';
import EmptyChatMessage from '../components/EmptyChatMessage.vue';
import ChatBubble from '../components/ChatBubble.vue';

export default defineComponent({
  name: 'ChatView',
  components: {
    ChatBody,
    ChatInput,
    EmptyChatMessage,
    ChatBubble,
  },
  props: {
    chatId: {
      type: String as unknown as PropType<ID<Chat>>,
      required: true,
    },
  },
  setup(props) {
    const chat = useCoState(Chat, props.chatId, [{}]).value;
    const showNLastMessages = ref(30);

    const displayedMessages = computed(() => {
      return chat?.slice(-showNLastMessages.value).reverse();
    });

    function showMoreMessages() {
      showNLastMessages.value += 10;
    }

    function handleSubmit(text: string) {
      chat?.push(Message.create({ text }, { owner: chat._owner }));
    }

    return {
      chat,
      showNLastMessages,
      displayedMessages,
      showMoreMessages,
      handleSubmit,
    };
  },
});
</script>
