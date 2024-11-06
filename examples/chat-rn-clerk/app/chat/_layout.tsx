import { Stack } from "expo-router";
import React from "react";

export default function ChatLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackVisible: true,
        headerTitle: "",
      }}
    />
  );
}
