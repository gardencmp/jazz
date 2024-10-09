import { useEffect, useState } from "react";
import React, {
    Button,
    FlatList,
    KeyboardAvoidingView,
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Alert,
} from "react-native";
import { Group, ID } from "jazz-tools";
import clsx from "clsx";
import * as Clipboard from "expo-clipboard";

import { Chat, Message } from "./schema";
import { useAccount, useCoState } from "./jazz";

export default function ChatScreen({ navigation }: { navigation: any }) {
    const { me, logOut } = useAccount();
    const [chat, setChat] = useState<Chat>();
    const [message, setMessage] = useState("");
    const loadedChat = useCoState(Chat, chat?.id, [{}]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => <Button onPress={logOut} title="Logout" />,
            headerLeft: () =>
                chat ? (
                    <Button
                        onPress={() => {
                            if (chat?.id) {
                                Clipboard.setStringAsync(
                                    `https://chat.jazz.tools/#/chat/${chat.id}`,
                                );
                                Alert.alert(
                                    "Copied to clipboard",
                                    `Chat ID: ${chat.id}`,
                                );
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

    const sendMessage = () => {
        if (!chat) return;
        if (message.trim()) {
            chat.push(
                Message.create({ text: message }, { owner: chat._owner }),
            );
            setMessage("");
        }
    };

    const renderMessageItem = ({ item }: { item: Message }) => {
        const isMe = item._edits.text.by?.isMe;
        return (
            <View
                className={clsx(
                    `rounded-lg p-1 px-1.5 max-w-[80%] `,

                    isMe
                        ? `bg-gray-200 self-end text-right`
                        : `bg-gray-300 self-start `,
                )}
            >
                {!isMe ? (
                    <Text
                        className={clsx(
                            `text-xs text-gray-500`,
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
                    <Text className={clsx(`text-black text-md max-w-[85%]`)}>
                        {item.text}
                    </Text>
                    <Text
                        className={clsx(
                            "text-[10px] text-gray-500 text-right ml-2",
                            !isMe ? "mt-2" : "mt-1",
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
        <View className="flex flex-col h-full">
            {!chat ? (
                <View className="flex flex-col h-full items-center justify-center">
                    <TouchableOpacity
                        onPress={createChat}
                        className="bg-blue-500 p-4 rounded-md"
                    >
                        <Text className="text-white font-semibold">
                            Start new chat
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={joinChat}
                        className="bg-green-500 p-4 rounded-md mt-4"
                    >
                        <Text className="text-white font-semibold">
                            Join chat
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <FlatList
                        contentContainerStyle={{
                            flexGrow: 1,
                            flex: 1,
                            gap: 6,
                            padding: 8,
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
                        <SafeAreaView className="flex flex-row items-center gap-2">
                            <TextInput
                                className="rounded-full h-8 py-0 px-2  border border-gray-200 block flex-1"
                                value={message}
                                onChangeText={setMessage}
                                placeholder="Type a message..."
                                textAlignVertical="center"
                                onSubmitEditing={sendMessage}
                            />
                            <TouchableOpacity
                                onPress={sendMessage}
                                className="bg-gray-300 text-white rounded-full h-8 w-8 items-center justify-center"
                            >
                                <Text>↑</Text>
                            </TouchableOpacity>
                        </SafeAreaView>
                    </KeyboardAvoidingView>
                </>
            )}
        </View>
    );
}
