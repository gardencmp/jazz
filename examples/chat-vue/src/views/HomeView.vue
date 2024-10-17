<template>
    <div>Creating a new chat...</div>
  </template>
  
  <script setup lang="ts">
  import { useAccount } from '../main';
  import { useRouter } from 'vue-router';
  import { Group } from 'jazz-tools';
  import { Chat } from '../schema';

  const router = useRouter();
  const { me } = useAccount();

  if (me.value) {
    const group = Group.create({ owner: me.value });
    group.addMember("everyone", "writer");
    const chat = Chat.create([], { owner: group });
    router.push(`/chat/${chat.id}`);
  }
</script>
  