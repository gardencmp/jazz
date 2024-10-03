import React, { StrictMode, useEffect, useState } from "react";
import {
    NavigationContainer,
    useNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import HandleInviteScreen from "./invite";

import {
    useDemoAuth,
    DemoAuthBasicUI,
    createJazzRNApp,
} from "jazz-react-native";
import ChatScreen from "./chat";
import { MMKVStorage } from "./mmkv-storage";

const nativeStorage = new MMKVStorage();
const Stack = createNativeStackNavigator();

const Jazz = createJazzRNApp({ nativeStorage });
export const { useAccount, useCoState, useAcceptInvite } = Jazz;

const prefix = Linking.createURL("/");

const linking = {
    prefixes: [prefix],
    config: {
        screens: {
            HandleInviteScreen: {
                path: "router/invite/:valueHint?/:valueID/:inviteSecret",
            },
        },
    },
};

function App() {
    const [auth, state] = useDemoAuth();
    const [initialRoute, setInitialRoute] = useState<
        "ChatScreen" | "HandleInviteScreen"
    >("ChatScreen");
    const navigationRef = useNavigationContainerRef();

    useEffect(() => {
        Linking.getInitialURL().then((url) => {
            if (url) {
                if (url && url.includes("invite")) {
                    setInitialRoute("HandleInviteScreen");
                }
            }
        });
    }, []);

    if (!auth) {
        return null;
    }

    return (
        <StrictMode>
            <Jazz.Provider
                auth={auth}
                peer="wss://mesh.jazz.tools/?key=chat-rn-example-jazz@gcmp.io"
                storage={undefined}
            >
                <NavigationContainer linking={linking} ref={navigationRef}>
                    <Stack.Navigator initialRouteName={initialRoute}>
                        <Stack.Screen
                            name="ChatScreen"
                            component={ChatScreen}
                        />
                        <Stack.Screen
                            name="HandleInviteScreen"
                            component={HandleInviteScreen}
                        />
                    </Stack.Navigator>
                </NavigationContainer>
            </Jazz.Provider>
            <DemoAuthBasicUI appName="Jazz Chat" state={state} />
        </StrictMode>
    );
}

export default App;
