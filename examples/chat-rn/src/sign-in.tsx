import { useSignIn } from "@clerk/clerk-expo";
// import { Link, useRouter } from "expo-router";
import { Text, TextInput, Button, View, TouchableOpacity } from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";

export function SignInPage({ navigation, setAuthenticated }: any) {
    const { signIn, setActive, isLoaded } = useSignIn();

    // const router = useRouter();

    const [emailAddress, setEmailAddress] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [errorMessage, setErrorMessage] = React.useState("");

    const onSignInPress = React.useCallback(async () => {
        if (!isLoaded) {
            return;
        }

        setErrorMessage(""); // Clear previous error message before new attempt

        try {
            const signInAttempt = await signIn.create({
                identifier: emailAddress,
                password,
            });

            if (signInAttempt.status === "complete") {
                await setActive({ session: signInAttempt.createdSessionId });
                // router.replace("/");
                console.log("signInAttempt", signInAttempt);
                // navigation.navigate("ChatScreen");
                setAuthenticated(true);
            } else {
                // See https://clerk.com/docs/custom-flows/error-handling
                // for more info on error handling
                console.error(JSON.stringify(signInAttempt, null, 2));
                setErrorMessage("Invalid credentials. Please try again.");
            }
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2));
            // Set a more specific error message if available
            if (err.errors && err.errors[0]?.message) {
                setErrorMessage(err.errors[0].message);
            } else {
                setErrorMessage(
                    "An unexpected error occurred. Please try again.",
                );
            }
        }
    }, [isLoaded, emailAddress, password]);

    return (
        <View className="flex-1 justify-center items-center bg-gray-100 p-4">
            <Text className="text-2xl font-bold mb-6">Sign In</Text>
            {errorMessage ? (
                <Text className="text-red-500 mb-4">{errorMessage}</Text>
            ) : null}
            <TextInput
                autoCapitalize="none"
                value={emailAddress}
                placeholder="Email..."
                onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
                className="w-80 h-12 mb-4 px-4 bg-white border border-gray-300 rounded-lg"
            />
            <TextInput
                value={password}
                placeholder="Password..."
                secureTextEntry={true}
                onChangeText={(password) => setPassword(password)}
                className="w-80 h-12 mb-4 px-4 bg-white border border-gray-300 rounded-lg"
            />
            <Button
                title="Sign In"
                onPress={onSignInPress}
                // className="text-white text-lg"
            />
            <View className="flex-row items-center mt-4">
                <Text className="text-gray-600">Don't have an account?</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate("SignUp")} // Navigate to SignUp screen
                >
                    <Text className="text-blue-500 ml-2">Sign up</Text>
                </TouchableOpacity>
            </View>
            {/* <View>
                <Text>Don't have an account?</Text>
                <Link href="/sign-up">
                    <Text>Sign up</Text>
                </Link>
            </View> */}
        </View>
    );
}
