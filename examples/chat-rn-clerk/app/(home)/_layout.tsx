import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Stack } from "expo-router";
import { Text } from "react-native";

export default function HomeLayout() {
    const { isSignedIn } = useAuth();

    if (isSignedIn) {
        // return <Redirect href={"/chat"} />;
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}
