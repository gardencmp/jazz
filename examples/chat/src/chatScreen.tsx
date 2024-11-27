import { ID } from "jazz-tools";
import { useState } from "react";
import { useCoState } from "./main.tsx";
import { Chat, Message } from "./schema.ts";
import {
  BubbleBody,
  BubbleContainer,
  BubbleInfo,
  ChatBody,
  ChatInput,
  EmptyChatMessage,
} from "./ui.tsx";

export function ChatScreen(props: { chatID: ID<Chat> }) {
  const chat = useCoState(Chat, props.chatID, [{}]);
  const [showNLastMessages, setShowNLastMessages] = useState(30);

  return chat ? (
    <>
      <ChatBody>
        {chat.length > 0 ? (
          chat
            .slice(-showNLastMessages)
            .reverse() // this plus flex-col-reverse on ChatBody gives us scroll-to-bottom behavior
            .map((msg) => <ChatBubble msg={msg} key={msg.id} />)
        ) : (
          <EmptyChatMessage />
        )}
        {chat.length > showNLastMessages && (
          <button
            className="px-4 py-1 block mx-auto my-2 border rounded"
            onClick={() => setShowNLastMessages(showNLastMessages + 10)}
          >
            Show more
          </button>
        )}
      </ChatBody>
      <ChatInput
        onSubmit={(text) => {
          chat.push(Message.create({ text }, { owner: chat._owner }));
        }}
      />
    </>
  ) : (
    <div className="flex-1 flex justify-center items-center">Loading...</div>
  );
}

function ChatBubble(props: { msg: Message }) {
  const lastEdit = props.msg._edits.text;
  const fromMe = lastEdit.by?.isMe;

  return (
    <BubbleContainer fromMe={fromMe}>
      <BubbleBody fromMe={fromMe}>{props.msg.text}</BubbleBody>
      <BubbleInfo by={lastEdit.by?.profile?.name} madeAt={lastEdit.madeAt} />
    </BubbleContainer>
  );
}
