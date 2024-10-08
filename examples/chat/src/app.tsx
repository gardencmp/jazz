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
    history.replaceState({}, "", "/#/chat/" + chat.id);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };

  return (
    <AppContainer>
      <TopBar>
        <p>{me?.profile?.name}</p> · <button onClick={logOut}>Log out</button>
      </TopBar>
      {useIframeHashRouter().route({
        "/": () => createChat() as never,
        "/chat/:id": id => <ChatScreen chatID={id as ID<Chat>} />,
      })}
    </AppContainer>
  );
}
