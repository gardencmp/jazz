import { useFonts } from "expo-font";
import { Redirect, Slot, Stack, Tabs } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import {
    ClerkLoaded,
    ClerkProvider,
    useClerk,
    useUser,
} from "@clerk/clerk-expo";
import { useJazzClerkAuth } from "jazz-react-auth-clerk";
import { Text, View } from "react-native";
import { tokenCache } from "@/cache";
import { Jazz } from "@/src/jazz";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function JazzAndAuthWrapper({ children }: { children: React.ReactNode }) {
    const clerk = useClerk();
    const [auth, state] = useJazzClerkAuth(clerk);

    return (
        <>
            {state.errors.map((error) => (
                <View key={error}>
                    <Text style={{ color: "red" }}>{error}</Text>
                </View>
            ))}
            {/* Render children (Navigation container) once auth is ready */}
            {auth ? (
                <Jazz.Provider
                    auth={auth}
                    peer="wss://mesh.jazz.tools/?key=chat-rn-clerk-example-jazz@gcmp.io"
                    storage={undefined}
                >
                    {children}
                </Jazz.Provider>
            ) : (
                children
            )}
        </>
    );
}

export default function RootLayout() {
    const [loaded] = useFonts({
        SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    });

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    if (!loaded) {
        return null;
    }

    const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

    if (!publishableKey) {
        throw new Error(
            "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env",
        );
    }

    return (
        <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
            <ClerkLoaded>
                <JazzAndAuthWrapper>
                    <Slot />
                </JazzAndAuthWrapper>
            </ClerkLoaded>
        </ClerkProvider>
    );
}
