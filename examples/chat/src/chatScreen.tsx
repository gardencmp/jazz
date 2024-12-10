import { createImage } from "jazz-browser-media-images";
import { ID } from "jazz-tools";
import { useState } from "react";
import { useAccount, useCoState } from "./main.tsx";
import { Chat, Message } from "./schema.ts";
import {
  BubbleBody,
  BubbleContainer,
  BubbleImage,
  BubbleInfo,
  BubbleText,
  ChatBody,
  EmptyChatMessage,
  ImageInput,
  InputBar,
  TextInput,
} from "./ui.tsx";

export function ChatScreen(props: { chatID: ID<Chat> }) {
  const chat = useCoState(Chat, props.chatID, [{}]);
  const { me } = useAccount();
  const [showNLastMessages, setShowNLastMessages] = useState(30);

  if (!chat)
    return (
      <div className="flex-1 flex justify-center items-center">Loading...</div>
    );

  const sendImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!me?.profile) return;

    const file = event.currentTarget.files?.[0];

    if (!file) return;

    if (file.size > 5000000) {
      alert("Please upload an image less than 5MB.");
      return;
    }

    createImage(file, { owner: chat._owner }).then((image) => {
      chat.push(
        Message.create(
          { text: file.name, image: image },
          { owner: chat._owner },
        ),
      );
    });
  };

  return (
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

      <InputBar>
        <ImageInput onImageChange={sendImage} />

        <TextInput
          onSubmit={(text) => {
            chat.push(Message.create({ text }, { owner: chat._owner }));
          }}
        />
      </InputBar>
    </>
  );
}

function ChatBubble(props: { msg: Message }) {
  const lastEdit = props.msg._edits.text;
  const fromMe = lastEdit.by?.isMe;
  const { text, image } = props.msg;

  return (
    <BubbleContainer fromMe={fromMe}>
      <BubbleBody fromMe={fromMe}>
        {image && <BubbleImage image={image} />}
        <BubbleText text={text} />
      </BubbleBody>
      <BubbleInfo by={lastEdit.by?.profile?.name} madeAt={lastEdit.madeAt} />
    </BubbleContainer>
  );
}
