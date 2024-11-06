import { useSignUp } from "@clerk/clerk-expo";
import { useNavigation } from "@react-navigation/native";
import * as React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");
  const navigation = useNavigation();

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    setErrorMessage("");

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
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;

    setErrorMessage("");

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
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
    <View className="flex-1 justify-center items-center bg-gray-50 p-6">
      <View className="bg-white w-11/12 max-w-md p-8 rounded-lg shadow-lg">
        <Text className="text-3xl font-bold text-center text-gray-800 mb-6">
          {pendingVerification ? "Verify Email" : "Sign Up"}
        </Text>
        {errorMessage ? (
          <Text className="text-red-500 text-center mb-4">{errorMessage}</Text>
        ) : null}

        {!pendingVerification && (
          <>
            <TextInput
              autoCapitalize="none"
              value={emailAddress}
              placeholder="Email..."
              onChangeText={(email) => setEmailAddress(email)}
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
              onPress={onSignUpPress}
              className="w-full h-12 bg-blue-600 rounded-lg flex justify-center items-center mb-4"
            >
              <Text className="text-white text-lg font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </>
        )}

        {pendingVerification && (
          <>
            <TextInput
              value={code}
              placeholder="Verification Code..."
              onChangeText={(code) => setCode(code)}
              className="w-full h-12 mb-4 px-4 bg-gray-100 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
            <TouchableOpacity
              onPress={onPressVerify}
              className="w-full h-12 bg-green-600 rounded-lg flex justify-center items-center mb-4"
            >
              <Text className="text-white text-lg font-semibold">
                Verify Email
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}
