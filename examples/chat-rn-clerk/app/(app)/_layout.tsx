import React from "react";
import { useAuth } from "../../src/auth-context";
import { Redirect, Stack } from "expo-router";

export default function HomeLayout() {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <Redirect href={"/chat"} />;
    }

    return (
        <Stack
            screenOptions={{ headerShown: false, headerBackVisible: true }}
        />
    );
}
