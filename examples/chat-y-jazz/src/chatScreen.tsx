import { ID } from "jazz-tools";
import { useEffect, useState } from "react";
import { useY } from "react-yjs";
import { YjsJazzDoc } from "y-jazz";
import { Array as YArray } from "yjs";
import { useAccount } from "./main.tsx";
import {
  BubbleBody,
  BubbleContainer,
  BubbleText,
  ChatBody,
  EmptyChatMessage,
  InputBar,
  TextInput,
} from "./ui.tsx";

export function ChatScreenLoader(props: { chatID: ID<YjsJazzDoc> }) {
  const [chat, setChat] = useState<YjsJazzDoc | undefined>(undefined);
  const { me } = useAccount();

  useEffect(() => {
    if (me) {
      YjsJazzDoc.load(props.chatID, me, []).then(setChat);
    }
  }, [me]);

  return chat ? (
    <ChatScreen chat={chat} />
  ) : (
    <div className="flex-1 flex justify-center items-center">Loading...</div>
  );
}

function ChatScreen(props: { chat: YjsJazzDoc }) {
  const [showNLastMessages, setShowNLastMessages] = useState(30);

  const messages = useY<YArray<string>>(
    props.chat.currentDoc.getArray("messages"),
  );

  return (
    <>
      <ChatBody>
        {messages.length > 0 ? (
          messages
            .slice(-showNLastMessages)
            .reverse() // this plus flex-col-reverse on ChatBody gives us scroll-to-bottom behavior
            .map((msg, index) => <ChatBubble msg={msg} key={index} />)
        ) : (
          <EmptyChatMessage />
        )}
        {messages.length > showNLastMessages && (
          <button
            className="px-4 py-1 block mx-auto my-2 border rounded"
            onClick={() => setShowNLastMessages(showNLastMessages + 10)}
          >
            Show more
          </button>
        )}
      </ChatBody>

      <InputBar>
        <TextInput
          onSubmit={(text) => {
            const messages = props.chat.currentDoc.getArray<string>("messages");
            messages.push([text]);
          }}
        />
      </InputBar>
    </>
  );
}

function ChatBubble(props: { msg: string }) {
  // const lastEdit = props.msg._edits.text;
  const fromMe = false; //lastEdit.by?.isMe;

  return (
    <BubbleContainer fromMe={fromMe}>
      <BubbleBody fromMe={fromMe}>
        <BubbleText text={props.msg} />
      </BubbleBody>
      {/* <BubbleInfo by={lastEdit.by?.profile?.name} madeAt={lastEdit.madeAt} /> */}
    </BubbleContainer>
  );
}
