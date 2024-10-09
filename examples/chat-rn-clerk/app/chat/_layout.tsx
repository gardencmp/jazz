import { Redirect, Stack } from "expo-router";
import { Button, Text } from "react-native";

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
