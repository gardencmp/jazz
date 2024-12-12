import { inIframe } from "@/util.ts";
import { useIframeHashRouter } from "hash-slash";
import { Group, ID } from "jazz-tools";
import { LoroDoc } from "loro-crdt";
import { LoroJazzDoc } from "loro-jazz";
import { ChatScreen } from "./chatScreen.tsx";
import { useAccount } from "./main.tsx";
import { AppContainer, TopBar } from "./ui.tsx";

export function App() {
  const { me, logOut } = useAccount();
  const router = useIframeHashRouter();

  const createChat = () => {
    if (!me) return;
    const group = Group.create({ owner: me });
    group.addMember("everyone", "writer");
    const chat = LoroJazzDoc.createFromLoroDoc(new LoroDoc(), {
      owner: group,
    });
    router.navigate("/#/chat/" + chat.id);
  };

  return (
    <AppContainer>
      <TopBar>
        <p>{me?.profile?.name}</p>
        {!inIframe && <button onClick={logOut}>Log out</button>}
      </TopBar>
      {router.route({
        "/": () => createChat() as never,
        "/chat/:id": (id) => <ChatScreen chatID={id as ID<LoroJazzDoc>} />,
      })}
    </AppContainer>
  );
}
