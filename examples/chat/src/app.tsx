import { CoMap, CoList, co, Group, ID } from "jazz-tools";
import { createJazzReactContext, DemoAuth } from "jazz-react";
import { createRoot } from "react-dom/client";
import { useIframeHashRouter } from "hash-slash";
import { ChatScreen } from "./chatScreen.tsx";
import { StrictMode } from "react";

export class Message extends CoMap {
  text = co.string;
}

export class Chat extends CoList.Of(co.ref(Message)) {}

const Jazz = createJazzReactContext({
  auth: DemoAuth({ appName: "Jazz Chat" }),
  peer: `wss://mesh.jazz.tools/?key=you@example.com`
});
export const { useAccount, useCoState } = Jazz;


function App() {
  const { me, logOut } = useAccount();

  const createChat = () => {
    const group = Group.create({ owner: me });
    group.addMember("everyone", "writer");
    const chat = Chat.create([], { owner: group });
    location.hash = "/chat/" + chat.id;
  };

  return <div className="flex flex-col items-center justify-between w-screen h-screen p-2 dark:bg-black dark:text-white">
    <div className="rounded mb-5 px-2 py-1 text-sm self-end">
      {me.profile?.name} · <button onClick={logOut}>Log Out</button>
    </div>
    {useIframeHashRouter().route({
      '/': () => createChat() as never,
      '/chat/:id': (id) => <ChatScreen chatID={id as ID<Chat>} />
    })}
  </div>;
}

createRoot(document.getElementById("root")!)
  .render(<StrictMode><Jazz.Provider><App/></Jazz.Provider></StrictMode>);