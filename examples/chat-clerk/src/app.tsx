import { Group, ID } from "jazz-tools";
import { useIframeHashRouter } from "hash-slash";
import { useAccount } from "./main.tsx";
import { Chat } from "./schema.ts";
import { ChatScreen } from "./chatScreen.tsx";
import { AppContainer, TopBar } from "./ui.tsx";

export function App() {
  const { me, logOut } = useAccount();

  const createChat = () => {
    if (!me) return;
    const group = Group.create({ owner: me });
    group.addMember("everyone", "writer");
    const chat = Chat.create([], { owner: group });
    location.hash = "/chat/" + chat.id;
  };

  return (
    <AppContainer>
      <TopBar>
        {me?.profile?.name} · <button onClick={logOut}>Log Out</button>
      </TopBar>
      {useIframeHashRouter().route({
        "/": () => createChat() as never,
        "/chat/:id": id => <ChatScreen chatID={id as ID<Chat>} />,
      })}
    </AppContainer>
  );
}
