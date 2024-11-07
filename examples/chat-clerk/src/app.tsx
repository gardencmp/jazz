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
    if (!me) return;
    const group = Group.create({ owner: me });
    group.addMember("everyone", "writer");
    const chat = Chat.create([], { owner: group });
    router.navigate("/#/chat/" + chat.id);
  };

  return (
    <AppContainer>
      <TopBar>
        {me?.profile?.name} · <button onClick={logOut}>Log out</button>
      </TopBar>
      {router.route({
        "/": () => createChat() as never,
        "/chat/:id": (id) => <ChatScreen chatID={id as ID<Chat>} />,
      })}
    </AppContainer>
  );
}
