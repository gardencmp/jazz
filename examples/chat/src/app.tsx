import { ID, Group, CoMap, CoList, co } from "jazz-tools";
import { JazzReact, DemoAuth } from "jazz-react";
import { createRoot } from "react-dom/client";
import { useIframeHashRouter } from "hash-slash";
import { ChatScreen } from "./chatScreen.tsx";

export class Message extends CoMap<Message> {
  text = co.string;
}

export class Chat extends CoList.Of(co.ref(Message)) {}

const Jazz = JazzReact({
  auth: DemoAuth({ appName: "Jazz Chat" }),
  apiKey: import.meta.env.VITE_JAZZ_KEY
});
export const { useAccount, useCoState } = Jazz;

createRoot(document.getElementById("root")!)
  .render(<Jazz.Provider><App /></Jazz.Provider>);

function App() {
  return <div className="flex flex-col items-center justify-between w-screen h-screen p-2 dark:bg-black dark:text-white">
    <button onClick={useAccount().logOut} className="rounded mb-5 px-2 py-1 bg-stone-200 dark:bg-stone-800 dark:text-white self-end">Log Out</button>
    { useIframeHashRouter().route({
      '/': () => <StartScreen />,
      '/chat/:id': (id) => <ChatScreen chatID={id as ID<Chat>} />}) }
  </div>;
}

function StartScreen() {
  const { me } = useAccount();

  const createChat = () => {
    const group = new Group({ owner: me });
    group.addMember("everyone", "writer");
    const chat = new Chat([], { owner: group });
    location.hash = "/chat/" + chat.id;
  };

  return <button onClick={createChat} className="rounded py-2 px-4 bg-stone-200 dark:bg-stone-800 dark:text-white my-auto">Create New Chat</button>;
}
