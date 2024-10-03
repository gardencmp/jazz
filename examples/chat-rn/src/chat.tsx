import { useEffect, useState } from "react";
import React, {
    Button,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Group } from "jazz-tools";
import { Chat, Message } from "./schema";
import { useAccount, useCoState } from "./App";

export default function ChatScreen() {
    const { me, logOut } = useAccount();
    const [chat, setChat] = useState<Chat>();
    const [message, setMessage] = useState("");
    const loadedChat = useCoState(Chat, chat?.id, [{}]);

    useEffect(() => {
        if (me) {
            createChat();
        }
    }, [me?.id]);

    const sendMessage = () => {
        if (!chat) return;
        if (message.trim()) {
            chat.push(
                Message.create({ text: message }, { owner: chat._owner }),
            );
            setMessage("");
        }
    };

    const createChat = () => {
        const group = Group.create({ owner: me });
        group.addMember("everyone", "writer");
        const chat = Chat.create([], { owner: group });
        setChat(chat);
    };

    // Render chat bubbles
    const renderMessageItem = ({ item }: { item: Message }) => (
        <View
            style={[
                styles.chatBubble,
                item._edits.text.by?.isMe
                    ? styles.myMessage
                    : styles.otherMessage,
            ]}
        >
            <Text style={styles.chatText}>{item.text}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.userText}>
                    Logged in as: {me.profile?.name}
                </Text>
                <Button title="Logout" onPress={logOut} />
            </View>

            <FlatList
                data={loadedChat}
                keyExtractor={(item) => item.id}
                renderItem={renderMessageItem}
                contentContainerStyle={styles.chatContainer}
            />

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Type a message..."
                />
                <TouchableOpacity
                    style={styles.sendButton}
                    onPress={sendMessage}
                >
                    <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 10,
        backgroundColor: "#6200ee",
    },
    userText: {
        color: "#fff",
        fontWeight: "bold",
    },
    logoutText: {
        color: "#fff",
        textDecorationLine: "underline",
    },
    chatContainer: {
        padding: 10,
        flexGrow: 1,
    },
    chatBubble: {
        borderRadius: 20,
        padding: 10,
        marginVertical: 5,
        maxWidth: "70%",
    },
    myMessage: {
        backgroundColor: "#6200ee",
        alignSelf: "flex-end",
    },
    otherMessage: {
        backgroundColor: "#e0e0e0",
        alignSelf: "flex-start",
    },
    chatText: {
        color: "#000",
    },
    inputContainer: {
        flexDirection: "row",
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: "#e0e0e0",
        alignItems: "center",
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#ffffff",
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#e0e0e0",
        borderRadius: 20,
        paddingHorizontal: 15,
        marginRight: 10,
    },
    sendButton: {
        backgroundColor: "#6200ee",
        borderRadius: 20,
        justifyContent: "center",
        paddingHorizontal: 15,
    },
    sendButtonText: {
        color: "#fff",
    },
});
