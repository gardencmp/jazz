import { ID } from "jazz-tools";
import { LoroList } from "loro-crdt";
import { LoroJazzDoc } from "loro-jazz";
import { useState } from "react";
import { useCoState } from "./main.tsx";
import {
  BubbleBody,
  BubbleContainer,
  BubbleText,
  ChatBody,
  EmptyChatMessage,
  InputBar,
  TextInput,
} from "./ui.tsx";

export function ChatScreen(props: { chatID: ID<LoroJazzDoc> }) {
  const chat = useCoState(LoroJazzDoc, props.chatID, []);
  const [showNLastMessages, setShowNLastMessages] = useState(30);

  if (!chat)
    return (
      <div className="flex-1 flex justify-center items-center">Loading...</div>
    );

  const messages = chat.currentDoc.getList("messages") as LoroList<string>;

  return (
    <>
      <ChatBody>
        {messages.length > 0 ? (
          messages
            .toArray()
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
            messages.push(text);
            chat.currentDoc.commit();
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
    </BubbleContainer>
  );
}
