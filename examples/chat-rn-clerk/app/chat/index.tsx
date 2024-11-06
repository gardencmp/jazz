import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { ID } from "jazz-tools";
import { useLayoutEffect } from "react";
import React, {
  Button,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";

import { useUser } from "@clerk/clerk-expo";
import { useAccount } from "../../src/jazz";
import { Chat } from "../../src/schema";

export default function ChatScreen() {
  const { logOut } = useAccount();
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useUser();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Chat",
      headerRight: () => <Button onPress={logOut} title="Logout" />,
    });
  }, [navigation]);

  const loadChat = async (chatId: ID<Chat> | "new") => {
    router.navigate(`/chat/${chatId}`);
  };

  const joinChat = () => {
    Alert.prompt(
      "Join Chat",
      "Enter the Chat ID (example: co_zBGEHYvRfGuT2YSBraY3njGjnde)",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Join",
          onPress: (chatId) => {
            if (chatId) {
              loadChat(chatId as ID<Chat>);
            } else {
              Alert.alert("Error", "Chat ID cannot be empty.");
            }
          },
        },
      ],
      "plain-text",
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-1 justify-center items-center px-6">
        <View className="w-full max-w-sm bg-white p-8 rounded-lg shadow-lg">
          <Text className="text-xl font-semibold text-gray-800">
            Welcome, {user?.emailAddresses[0].emailAddress}
          </Text>
          <TouchableOpacity
            onPress={() => loadChat("new")}
            className="w-full bg-blue-600 py-4 rounded-md mb-4 mt-4"
          >
            <Text className="text-white text-lg font-semibold text-center">
              Start New Chat
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={joinChat}
            className="w-full bg-green-500 py-4 rounded-md"
          >
            <Text className="text-white text-lg font-semibold text-center">
              Join Chat
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
