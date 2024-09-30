import { ID } from "jazz-tools";
import { Chat, Message } from "./schema.ts";
import { useCoState } from "./main.tsx";
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

  return chat ? (
    <>
      <ChatBody>
        {chat.length > 0 ? (
          chat.map(msg => <ChatBubble msg={msg} key={msg.id} />)
        ) : (
          <EmptyChatMessage />
        )}
      </ChatBody>
      <ChatInput
        onSubmit={text => {
          chat.push(Message.create({ text }, { owner: chat._owner }));
        }}
      />
    </>
  ) : (
    <div>Loading...</div>
  );
}

function ChatBubble(props: { msg: Message }) {
  const lastEdit = props.msg._edits.text;

  return (
    <BubbleContainer fromMe={lastEdit.by?.isMe}>
      <BubbleBody>{props.msg.text}</BubbleBody>
      <BubbleInfo by={lastEdit.by?.profile?.name} madeAt={lastEdit.madeAt} />
    </BubbleContainer>
  );
}
