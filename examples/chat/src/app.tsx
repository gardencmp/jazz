import { useIframeHashRouter } from "hash-slash";
import { Account, CoValue, Group, ID } from "jazz-tools";
import { ChatScreen } from "./chatScreen.tsx";
import { useAccount } from "./main.tsx";
import { Chat } from "./schema.ts";
import { AppContainer, TopBar } from "./ui.tsx";

export function waitForUpload(id: ID<CoValue>, me: Account) {
  const syncManager = me._raw.core.node.syncManager;
  const peers = syncManager.getPeers();

  return Promise.all(
    peers.map((peer) => syncManager.waitForUploadIntoPeer(peer.id, id)),
  );
}

export function App() {
  const { me, logOut } = useAccount();
  const router = useIframeHashRouter();

  const createChat = () => {
    if (!me) return;
    const group = Group.create({ owner: me });
    group.addMember("everyone", "writer");
    const chat = Chat.create([], { owner: group });
    router.navigate("/#/chat/" + chat.id);

    if (window.parent) {
      waitForUpload(chat.id, me).then(() => {
        window.parent.postMessage(
          { type: "chat-load", id: "/chat/" + chat.id },
          "*",
        );
      });
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
