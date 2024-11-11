import { useIframeHashRouter } from "hash-slash";
import { Group, ID } from "jazz-tools";
import { ChatScreen } from "./chatScreen.tsx";
import { useAccount } from "./main.tsx";
import { Chat } from "./schema.ts";
import { AppContainer, TopBar } from "./ui.tsx";

export function App() {
  const { me, logOut } = useAccount();
  const router = useIframeHashRouter();

  const createChat = () => {
    console.log("createChat", window.location.href);
    if (!me) return;
    const group = Group.create({ owner: me });
    group.addMember("everyone", "writer");
    const chat = Chat.create([], { owner: group });
    router.navigate("/#/chat/" + chat.id);

    if (window.parent) {
      window.parent.postMessage(
        { type: "chat-load", id: "/chat/" + chat.id },
        "*",
      );
    }
  };

  return (
    <AppContainer>
      <TopBar>
        <p>{me?.profile?.name}</p> · <button onClick={logOut}>Log out</button>
      </TopBar>
      {router.route({
        "/": () => createChat() as never,
        "/chat/:id": (id) => <ChatScreen chatID={id as ID<Chat>} />,
      })}
    </AppContainer>
  );
}
