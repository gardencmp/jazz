import React from "react";
import * as WebBrowser from "expo-web-browser";
import { Text, View, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { useOAuth } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";

export const useWarmUpBrowser = () => {
    React.useEffect(() => {
        // Warm up the android browser to improve UX
        // https://docs.expo.dev/guides/authentication/#improving-user-experience
        void WebBrowser.warmUpAsync();
        return () => {
            void WebBrowser.coolDownAsync();
        };
    }, []);
};

WebBrowser.maybeCompleteAuthSession();

const SignInWithOAuth = () => {
    useWarmUpBrowser();

    const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

    const onPress = React.useCallback(async () => {
        try {
            const { createdSessionId, signIn, signUp, setActive } =
                await startOAuthFlow({
                    redirectUrl: Linking.createURL("/", {
                        scheme: "jazz-chat-rn-clerk",
                    }),
                });

            if (createdSessionId) {
                setActive!({ session: createdSessionId });
            } else {
                // Use signIn or signUp for next steps such as MFA
            }
        } catch (err) {
            console.error("OAuth error", err);
        }
    }, []);

    return (
        <View className="flex-1 justify-center items-center bg-gray-50 p-6">
            <View className="bg-white w-11/12 max-w-md p-8 rounded-lg shadow-lg items-center">
                <TouchableOpacity
                    onPress={onPress}
                    className="w-full bg-red-500 py-3 rounded-lg flex items-center justify-center"
                >
                    <Text className="text-white text-lg font-semibold">
                        Sign in with Google
                    </Text>
                </TouchableOpacity>
                <Link href="/" className="mt-4">
                    <Text className="text-blue-600 text-lg font-semibold underline mb-6">
                        Back to Home
                    </Text>
                </Link>
            </View>
        </View>
    );
};
export default SignInWithOAuth;
