import React, { Text } from "react-native";
import { useAcceptInvite } from "./jazz";
import { Chat } from "./schema";

type ChatScreenParams = {
    valueHint?: string;
    valueID?: string;
    inviteSecret?: string;
};

export default function HandleInviteScreen({
    navigation,
}: {
    navigation: any;
}) {
    useAcceptInvite({
        invitedObjectSchema: Chat,
        onAccept: async (chatId) => {
            navigation.navigate("ChatScreen", { chatId });
        },
    });

    return <Text>Accepting invite...</Text>;
}
