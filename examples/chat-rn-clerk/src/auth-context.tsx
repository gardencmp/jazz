import React, {
    useContext,
    createContext,
    useEffect,
    useState,
    PropsWithChildren,
} from "react";
import { useClerk, useUser } from "@clerk/clerk-expo";
import { useJazzClerkAuth } from "jazz-react-auth-clerk";
import { Jazz } from "./jazz";
import { Text, View } from "react-native";

const AuthContext = createContext<{
    isAuthenticated: boolean;
    isLoading: boolean;
}>({
    isAuthenticated: false,
    isLoading: true,
});

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: PropsWithChildren) {
    const { isSignedIn, isLoaded: isClerkLoaded } = useUser();
    const clerk = useClerk();
    const [auth, state] = useJazzClerkAuth(clerk);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        if (isSignedIn && isClerkLoaded && auth) {
            setIsAuthenticated(true);
        } else {
            setIsAuthenticated(false);
        }
    }, [isSignedIn, isClerkLoaded, auth]);

    return (
        <AuthContext.Provider
            value={{ isAuthenticated, isLoading: !isClerkLoaded || !auth }}
        >
            {state.errors.length > 0 &&
                state.errors.map((error) => (
                    <View key={error}>
                        <Text style={{ color: "red" }}>{error}</Text>
                    </View>
                ))}
            {auth ? (
                <Jazz.Provider
                    auth={auth}
                    peer="wss://mesh.jazz.tools/?key=chat-rn-clerk-example-jazz@gcmp.io"
                    storage={undefined}
                >
                    {children}
                </Jazz.Provider>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
}
