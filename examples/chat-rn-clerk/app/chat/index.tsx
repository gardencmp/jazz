import { useEffect, useLayoutEffect, useState } from "react";
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
import { useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";

import { Chat, Message } from "../../src/schema";
import { useAccount, useCoState } from "../../src/jazz";

export default function ChatScreen() {
    const { me, logOut } = useAccount();
    const [chat, setChat] = useState<Chat>();
    const [message, setMessage] = useState("");
    const loadedChat = useCoState(Chat, chat?.id, [{}]);
    const router = useRouter();
    const navigation = useNavigation();

    // Effect to dynamically set header options
    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: "Chat",
            headerRight: () => <Button onPress={logOut} title="Logout" />,
        });
    }, [navigation]);

    const createChat = () => {
        const group = Group.create({ owner: me });
        group.addMember("everyone", "writer");
        const chat = Chat.create([], { owner: group });
        setChat(chat);
    };

    const loadChat = async (chatId: ID<Chat> | "new") => {
        router.navigate(`/chat/${chatId}`);
        // try {
        //     const chat = await Chat.load(chatId, me, []);
        //     setChat(chat);
        // } catch (error) {
        //     console.log("Error loading chat", error);
        //     Alert.alert("Error", `Error loading chat: ${error}`);
        // }
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
        <View className="flex-1 bg-gray-50">
            <View className="flex-1 justify-center items-center px-6">
                <View className="w-full max-w-sm bg-white p-8 rounded-lg shadow-lg">
                    <TouchableOpacity
                        onPress={() => loadChat("new")}
                        className="w-full bg-blue-600 py-4 rounded-md mb-4"
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
