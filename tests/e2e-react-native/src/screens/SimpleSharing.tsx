import * as Clipboard from "expo-clipboard";
import { createInviteLink } from "jazz-react-native";
import { Group, ID } from "jazz-tools";
import { useState } from "react";
import { Alert, Button, Text, View } from "react-native";
import { useAccount, useCoState } from "../jazz";
import { CoMapWithText } from "../schema";

export function SimpleSharing() {
  const [id, setId] = useState<ID<CoMapWithText> | undefined>();
  const [invite, setInvite] = useState<string | undefined>();
  const coMap = useCoState(CoMapWithText, id);
  const { me } = useAccount();

  function handleCreateCoMap() {
    if (!me) return;

    const group = Group.create({ owner: me });

    const coMap = CoMapWithText.create(
      { text: "Updated from React Native" },
      { owner: group },
    );

    const invite = createInviteLink(coMap, "writer").replace("undefined/", "/");

    setId(coMap.id);

    Clipboard.setStringAsync(`node validateCoValue.mjs ${invite}`);
    Alert.alert("Validate command copied to clipboard");

    setInvite(invite);
  }

  return (
    <>
      <Button onPress={handleCreateCoMap} title="Create CoMap" />
      <Text
        id="coMapText"
        style={{ fontSize: 20, padding: 20, textAlign: "center" }}
      >
        {coMap?.text}
      </Text>
      {invite && (
        <View
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: 2,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "bold" }}>Invite code</Text>
          <Text selectable id="invite">
            {invite}
          </Text>
        </View>
      )}
    </>
  );
}
