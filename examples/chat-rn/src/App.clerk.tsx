import React, { StrictMode, useEffect, useState } from "react";
import {
    NavigationContainer,
    useNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import HandleInviteScreen from "./invite";

import { useDemoAuth } from "jazz-react-native";
import ChatScreen from "./chat";
import { Jazz } from "./jazz";
import { tokenCache } from "./token-cache";
// Clerk imports
import { ClerkProvider, ClerkLoaded, useClerk } from "@clerk/clerk-expo";
import { useJazzClerkAuth } from "jazz-react-auth-clerk";
import { SignInPage } from "./sign-in";
import { SignUpPage } from "./sign-up";
import { Text, View } from "react-native";

// Navigation Setup
const Stack = createNativeStackNavigator();
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

// Authenticated stack
function AuthenticatedStack({
    setAuthenticated,
}: {
    setAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    console.log("rendering AuthenticatedStack");
    return (
        <Stack.Navigator initialRouteName="ChatScreen">
            <Stack.Screen options={{ title: "Jazz Chat" }} name="ChatScreen">
                {(props) => (
                    <ChatScreen
                        {...props}
                        setAuthenticated={setAuthenticated}
                    />
                )}
            </Stack.Screen>
            <Stack.Screen
                name="HandleInviteScreen"
                component={HandleInviteScreen}
            />
        </Stack.Navigator>
    );
}

// Unauthenticated stack
function UnauthenticatedStack({
    setAuthenticated,
}: {
    setAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    console.log("rendering UnauthenticatedStack");
    return (
        <Stack.Navigator initialRouteName="SignIn">
            <Stack.Screen name="SignIn">
                {(props) => (
                    <SignInPage
                        {...props}
                        setAuthenticated={setAuthenticated}
                    />
                )}
            </Stack.Screen>

            <Stack.Screen name="SignUp" component={SignUpPage} />
        </Stack.Navigator>
    );
}

// App Component with Navigation and Auth Context
function App() {
    const [isAuthReady, setAuthReady] = useState(false); // Tracks if auth is ready
    const [isAuthenticated, setAuthenticated] = useState(false); // Tracks if the user is authenticated
    const [initialRoute, setInitialRoute] = useState<
        "ChatScreen" | "HandleInviteScreen"
    >("ChatScreen");
    const navigationRef = useNavigationContainerRef();

    useEffect(() => {
        // Handle deep linking to the invite screen
        Linking.getInitialURL().then((url) => {
            if (url && url.includes("invite")) {
                setInitialRoute("HandleInviteScreen");
            }
        });
    }, []);

    console.log("isAuthReady", isAuthReady);
    console.log("isAuthenticated", isAuthenticated);

    return (
        <StrictMode>
            {/* Provide Clerk context */}
            <ClerkProvider
                publishableKey={
                    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KE ?? ""
                }
                afterSignOutUrl="/"
                tokenCache={tokenCache}
            >
                {/* Load Clerk and check for authentication */}
                <ClerkLoaded>
                    <JazzAndAuthWrapper
                        onAuthReady={(authStatus) => {
                            setAuthenticated(authStatus);
                            setAuthReady(true);
                        }}
                    >
                        {/* Navigation Container always present at the top */}
                        <NavigationContainer
                            linking={linking}
                            ref={navigationRef}
                        >
                            {/* Show stacks based on auth state */}
                            {isAuthReady ? (
                                isAuthenticated ? (
                                    <AuthenticatedStack
                                        setAuthenticated={setAuthenticated}
                                    />
                                ) : (
                                    <UnauthenticatedStack
                                        setAuthenticated={setAuthenticated}
                                    />
                                )
                            ) : (
                                // Placeholder until auth is ready
                                <Stack.Navigator>
                                    <Stack.Screen
                                        name="Loading"
                                        component={() => (
                                            <View className="flex-1 justify-center items-center">
                                                <Text>Loading...</Text>
                                            </View>
                                        )}
                                    />
                                </Stack.Navigator>
                            )}
                        </NavigationContainer>
                    </JazzAndAuthWrapper>
                </ClerkLoaded>
            </ClerkProvider>
        </StrictMode>
    );
}

// Jazz + Clerk Combined Auth Wrapper
function JazzAndAuthWrapper({
    children,
    onAuthReady,
}: {
    children: React.ReactNode;
    onAuthReady: (authStatus: boolean) => void;
}) {
    const clerk = useClerk();
    const [auth, state] = useJazzClerkAuth(clerk);

    console.log("auth in app.clerk", auth);

    useEffect(() => {
        if (auth) {
            console.log("auth is ready");
            onAuthReady(true); // Authenticated
        } else if (state && state.errors.length === 0) {
            console.log("auth is not ready");
            onAuthReady(false); // Not authenticated
        }
    }, [auth, state]);

    return (
        <>
            {state.errors.map((error) => (
                <View key={error}>
                    <Text style={{ color: "red" }}>{error}</Text>
                </View>
            ))}
            {/* Render children (Navigation container) once auth is ready */}
            {auth ? (
                <Jazz.Provider
                    auth={auth}
                    peer="wss://mesh.jazz.tools/?key=chat-rn-example-jazz@gcmp.io"
                    storage={undefined}
                >
                    {children}
                </Jazz.Provider>
            ) : (
                children
            )}
        </>
    );
}

export default App;
