import { useSignIn } from "@clerk/clerk-expo";
import { Link } from "expo-router";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

export default function SignInPage() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");

  const onSignInPress = React.useCallback(async () => {
    if (!isLoaded) {
      return;
    }

    setErrorMessage("");

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
        setErrorMessage("Invalid credentials. Please try again.");
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      if (err.errors && err.errors[0]?.message) {
        setErrorMessage(err.errors[0].message);
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    }
  }, [isLoaded, emailAddress, password]);

  return (
    <View className="flex-1 justify-center items-center bg-gray-50 p-6">
      <View className="bg-white w-11/12 max-w-md p-8 rounded-lg shadow-md">
        <Text className="text-3xl font-bold text-center text-gray-800 mb-6">
          Sign In
        </Text>
        {errorMessage ? (
          <Text className="text-red-500 text-center mb-4">{errorMessage}</Text>
        ) : null}
        <TextInput
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Email..."
          onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
          className="w-full h-12 mb-4 px-4 bg-gray-100 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
        />
        <TextInput
          value={password}
          placeholder="Password..."
          secureTextEntry={true}
          onChangeText={(password) => setPassword(password)}
          className="w-full h-12 mb-6 px-4 bg-gray-100 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
        />
        <TouchableOpacity
          onPress={onSignInPress}
          className="w-full h-12 bg-blue-600 rounded-lg flex items-center justify-center"
        >
          <Text className="text-white text-lg font-semibold">Sign In</Text>
        </TouchableOpacity>
        <View className="flex-row items-center justify-center mt-4">
          <Text className="text-gray-600">Don't have an account?</Text>
          <Link href="/sign-up">
            <Text className="text-blue-500 ml-2 font-semibold">Sign up</Text>
          </Link>
        </View>
      </View>
    </View>
  );
}
