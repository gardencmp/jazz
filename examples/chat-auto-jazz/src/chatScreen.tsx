import { ID } from "jazz-tools";
import { useState } from "react";
import { useCoState } from "./main.tsx";
import { Chat } from "./schema.ts";
import {
  BubbleBody,
  BubbleContainer,
  BubbleText,
  ChatBody,
  EmptyChatMessage,
  InputBar,
  TextInput,
} from "./ui.tsx";

export function ChatScreen(props: { chatID: ID<Chat> }) {
  const chat = useCoState(Chat, props.chatID, []);
  const [showNLastMessages, setShowNLastMessages] = useState(30);

  if (!chat)
    return (
      <div className="flex-1 flex justify-center items-center">Loading...</div>
    );

  return (
    <>
      <ChatBody>
        {chat.currentDoc.messages.length > 0 ? (
          chat.currentDoc.messages
            .slice(-showNLastMessages)
            .reverse() // this plus flex-col-reverse on ChatBody gives us scroll-to-bottom behavior
            .map((msg, index) => <ChatBubble msg={msg} key={index} />)
        ) : (
          <EmptyChatMessage />
        )}
        {chat.currentDoc.messages.length > showNLastMessages && (
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
            chat.change((chat) => {
              chat.messages.push(text);
            });
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
