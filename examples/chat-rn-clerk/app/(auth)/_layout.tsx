import { Redirect, Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

export default function UnAuthenticatedLayout() {
    const { isSignedIn } = useAuth();

    if (isSignedIn) {
        // return <Redirect href={"/chat"} />;
        return <Redirect href={"/"} />;
    }

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
