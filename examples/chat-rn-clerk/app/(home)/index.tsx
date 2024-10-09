import { useAccount } from "@/src/jazz";
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-expo";
import { Link, Redirect, router } from "expo-router";
import { Button, Text, View } from "react-native";

export default function HomePage() {
    const { user } = useUser();

    return (
        <View className="flex-1 justify-center items-center bg-gray-100 p-6">
            <SignedIn>
                {/* <Text className="text-xl font-semibold text-gray-800">
                    Welcome, {user?.emailAddresses[0].emailAddress}
                </Text> */}
                <Redirect href={"/chat"} />;
            </SignedIn>
            <SignedOut>
                <View className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-md">
                    <Text className="text-2xl font-bold text-center text-gray-900 mb-4">
                        Jazz 🤝 Clerk 🤝 Expo
                    </Text>
                    <Link href="/sign-in" className="mb-4">
                        <Text className="text-center text-blue-600 underline text-lg">
                            Sign In
                        </Text>
                    </Link>
                    <Link href="/sign-in-oauth" className="mb-4">
                        <Text className="text-center text-blue-600 underline text-lg">
                            Sign In OAuth
                        </Text>
                    </Link>
                    <Link href="/sign-up">
                        <Text className="text-center text-blue-600 underline text-lg">
                            Sign Up
                        </Text>
                    </Link>
                </View>
            </SignedOut>
        </View>
    );
}
