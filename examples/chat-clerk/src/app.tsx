import { CoMap, CoList, co, Group, ID } from "jazz-tools";
import { createJazzReactApp } from "jazz-react";
import { useJazzClerkAuth } from "jazz-react-auth-clerk";
import { createRoot } from "react-dom/client";
import { useIframeHashRouter } from "hash-slash";
import { ChatScreen } from "./chatScreen.tsx";
import { StrictMode } from "react";

import {
    ClerkProvider,
    SignInButton,
    useAuth,
    useClerk,
} from "@clerk/clerk-react";

export class Message extends CoMap {
    text = co.string;
}

export class Chat extends CoList.Of(co.ref(Message)) {}

const Jazz = createJazzReactApp();
export const { useAccount, useCoState } = Jazz;

function AuthAndJazz({ children }: { children: React.ReactNode }) {
    const clerk = useClerk();
    const [auth, state] = useJazzClerkAuth(clerk);

    return (
        <>
            {state.errors.map((error) => (
                <div key={error}>{error}</div>
            ))}
            {auth ? (
                <Jazz.Provider
                    auth={auth}
                    peer="wss://mesh.jazz.tools/?key=chat-example-jazz-clerk@gcmp.io"
                >
                    {children}
                </Jazz.Provider>
            ) : (
                <SignInButton />
            )}
        </>
    );
}

function App() {
    const { signOut } = useAuth();
    const { me } = useAccount();

    const createChat = () => {
        if (!me) return;
        const group = Group.create({ owner: me });
        group.addMember("everyone", "writer");
        const chat = Chat.create([], { owner: group });
        location.hash = "/chat/" + chat.id;
    };

    return (
        <div className="flex flex-col items-center justify-between w-screen h-screen p-2 dark:bg-black dark:text-white">
            <div className="rounded mb-5 px-2 py-1 text-sm self-end">
                {me?.profile?.name} ·{" "}
                <button onClick={() => signOut()}>Log Out</button>
            </div>
            {useIframeHashRouter().route({
                "/": () => createChat() as never,
                "/chat/:id": (id) => <ChatScreen chatID={id as ID<Chat>} />,
            })}
        </div>
    );
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ClerkProvider
            publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
            afterSignOutUrl="/"
        >
            <AuthAndJazz>
                <App />
            </AuthAndJazz>
        </ClerkProvider>
    </StrictMode>
);
