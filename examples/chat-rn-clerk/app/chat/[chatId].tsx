import { useAccount, useCoState } from "@/src/jazz";
import { Chat, Message } from "@/src/schema";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import clsx from "clsx";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams } from "expo-router";
import { Group, ID } from "jazz-tools";
import { useEffect, useLayoutEffect, useState } from "react";
import React, {
  SafeAreaView,
  View,
  Text,
  Alert,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  TextInput,
  Button,
} from "react-native";

export default function Conversation() {
  const { chatId } = useLocalSearchParams();
  const { me } = useAccount();
  const [chat, setChat] = useState<Chat>();
  const [message, setMessage] = useState("");
  const loadedChat = useCoState(Chat, chat?.id, [{}]);
  const navigation = useNavigation();

  useEffect(() => {
    if (chat) return;
    if (chatId === "new") {
      createChat();
    } else {
      loadChat(chatId as ID<Chat>);
    }
  }, [chat]);

  // Effect to dynamically set header options
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Chat",
      headerRight: () =>
        chat ? (
          <Button
            onPress={() => {
              if (chat?.id) {
                Clipboard.setStringAsync(
                  `https://chat.jazz.tools/#/chat/${chat.id}`,
                );
                Alert.alert("Copied to clipboard", `Chat ID: ${chat.id}`);
              }
            }}
            title="Share"
          />
        ) : null,
    });
  }, [navigation, chat]);

  const createChat = () => {
    const group = Group.create({ owner: me });
    group.addMember("everyone", "writer");
    const chat = Chat.create([], { owner: group });
    setChat(chat);
  };

  const loadChat = async (chatId: ID<Chat>) => {
    try {
      const chat = await Chat.load(chatId, me, []);
      setChat(chat);
    } catch (error) {
      console.log("Error loading chat", error);
      Alert.alert("Error", `Error loading chat: ${error}`);
    }
  };

  const sendMessage = () => {
    if (!chat) return;
    if (message.trim()) {
      chat.push(Message.create({ text: message }, { owner: chat._owner }));
      setMessage("");
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMe = item._edits.text.by?.isMe;
    return (
      <View
        className={clsx(
          `rounded-xl px-3 py-2 max-w-[75%] my-1`,
          isMe ? `bg-blue-500 self-end` : `bg-gray-200 self-start`,
        )}
      >
        {!isMe ? (
          <Text
            className={clsx(
              `text-xs text-gray-500 mb-1`,
              isMe ? "text-right" : "text-left",
            )}
          >
            {item._edits.text.by?.profile?.name}
          </Text>
        ) : null}
        <View
          className={clsx(
            "flex relative items-end justify-between",
            isMe ? "flex-row" : "flex-row",
          )}
        >
          <Text
            className={clsx(
              !isMe ? "text-black" : "text-gray-200",
              `text-md max-w-[85%]`,
            )}
          >
            {item.text}
          </Text>
          <Text
            className={clsx(
              "text-[10px] text-right ml-2",
              !isMe ? "mt-2 text-gray-500" : "mt-1 text-gray-200",
            )}
          >
            {item._edits.text.madeAt.getHours()}:
            {item._edits.text.madeAt.getMinutes()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        contentContainerStyle={{
          flexGrow: 1,
          paddingVertical: 10,
          paddingHorizontal: 8,
        }}
        className="flex"
        data={loadedChat}
        keyExtractor={(item) => item.id}
        renderItem={renderMessageItem}
      />
      <KeyboardAvoidingView
        keyboardVerticalOffset={110}
        behavior="padding"
        className="p-3 bg-white border-t border-gray-300"
      >
        <SafeAreaView className="flex-row items-center gap-2">
          <TextInput
            className="flex-1 rounded-full h-10 px-4 bg-gray-100 border border-gray-300 focus:border-blue-500 focus:bg-white"
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            textAlignVertical="center"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            onPress={sendMessage}
            className="bg-blue-500 rounded-full h-10 w-10 items-center justify-center"
          >
            <Text className="text-white text-xl">↑</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}
