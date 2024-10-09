import * as React from "react";
import { TextInput, Button, View, Text, TouchableOpacity } from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { clsx } from "clsx"; // Use clsx for conditional classes if needed
import { useNavigation } from "@react-navigation/native";

export function SignUpPage() {
    const { isLoaded, signUp, setActive } = useSignUp();

    const [emailAddress, setEmailAddress] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [pendingVerification, setPendingVerification] = React.useState(false);
    const [code, setCode] = React.useState("");
    const [errorMessage, setErrorMessage] = React.useState("");
    const navigation = useNavigation(); // Initialize navigation

    const onSignUpPress = async () => {
        if (!isLoaded) return;

        setErrorMessage(""); // Clear any existing error messages

        try {
            await signUp.create({
                emailAddress,
                password,
            });

            await signUp.prepareEmailAddressVerification({
                strategy: "email_code",
            });

            setPendingVerification(true);
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2));
            if (err.errors && err.errors[0]?.message) {
                setErrorMessage(err.errors[0].message);
            } else {
                setErrorMessage(
                    "An unexpected error occurred. Please try again.",
                );
            }
        }
    };

    const onPressVerify = async () => {
        if (!isLoaded) return;

        setErrorMessage("");

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification(
                {
                    code,
                },
            );

            if (completeSignUp.status === "complete") {
                await setActive({ session: completeSignUp.createdSessionId });
                navigation.navigate("ChatScreen");
            } else {
                console.error(JSON.stringify(completeSignUp, null, 2));
                setErrorMessage("Failed to verify. Please check your code.");
            }
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2));
            setErrorMessage("Invalid verification code. Please try again.");
        }
    };

    return (
        <View className="flex-1 justify-center items-center bg-gray-100 p-4">
            <Text className="text-2xl font-bold mb-6">Sign Up</Text>
            {errorMessage ? (
                <Text className="text-red-500 mb-4">{errorMessage}</Text>
            ) : null}

            {!pendingVerification && (
                <>
                    <TextInput
                        autoCapitalize="none"
                        value={emailAddress}
                        placeholder="Email..."
                        onChangeText={(email) => setEmailAddress(email)}
                        className="w-80 h-12 mb-4 px-4 bg-white border border-gray-300 rounded-lg"
                    />
                    <TextInput
                        value={password}
                        placeholder="Password..."
                        secureTextEntry={true}
                        onChangeText={(password) => setPassword(password)}
                        className="w-80 h-12 mb-6 px-4 bg-white border border-gray-300 rounded-lg"
                    />
                    <TouchableOpacity
                        onPress={onSignUpPress}
                        className="w-80 h-12 bg-blue-500 rounded-lg justify-center items-center mb-4"
                    >
                        <Text className="text-white text-lg">Sign Up</Text>
                    </TouchableOpacity>
                </>
            )}

            {pendingVerification && (
                <>
                    <TextInput
                        value={code}
                        placeholder="Verification Code..."
                        onChangeText={(code) => setCode(code)}
                        className="w-80 h-12 mb-4 px-4 bg-white border border-gray-300 rounded-lg"
                    />
                    <TouchableOpacity
                        onPress={onPressVerify}
                        className="w-80 h-12 bg-blue-500 rounded-lg justify-center items-center mb-4"
                    >
                        <Text className="text-white text-lg">Verify Email</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
}
