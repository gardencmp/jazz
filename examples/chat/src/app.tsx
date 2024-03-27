import { DemoAuth, createReactContext } from "jazz-react";
import ReactDOM from "react-dom/client";
import { HashRoute } from "hash-slash";
import { ChatWindow } from "./chatWindow.tsx";
import { Co, ID, S, SimpleAccount, SimpleGroup } from "jazz-js";

export class Message extends Co.map({ text: S.string }).as<Message>() {}
export class Chat extends Co.list(Message).as<Chat>() {}

export const { JazzProvider, useAccount, useCoState } = createReactContext({
    auth: DemoAuth({ appName: "Jazz Chat Example" }),
    accountSchema: SimpleAccount,
    apiKey: "api_z9d034j3t34ht034ir",
});

ReactDOM.createRoot(document.getElementById("root")!).render(
    <JazzProvider>
        <App />
    </JazzProvider>
);

function App() {
    return (
        <div className="flex flex-col items-center justify-between w-screen h-screen p-2 dark:bg-black dark:text-white">
            <button
                onClick={useAccount().logOut}
                className="rounded mb-5 px-2 py-1 bg-stone-200 dark:bg-stone-800 dark:text-white self-end"
            >
                Log Out
            </button>
            {HashRoute(
                {
                    "/": <Home />,
                    "/chat/:id": (id) => <ChatWindow chatId={id as ID<Chat>} />,
                },
                { reportToParentFrame: true }
            )}
        </div>
    );
}

function Home() {
    const { me } = useAccount();
    return (
        <button
            className="rounded py-2 px-4 bg-stone-200 dark:bg-stone-800 dark:text-white my-auto"
            onClick={() => {
                const group = new SimpleGroup(undefined, { owner: me }).addMember(
                    "everyone",
                    "writer"
                );
                const chat = new Chat([], { owner: group });
                location.hash = "/chat/" + chat.id;
            }}
        >
            Create New Chat
        </button>
    );
}
