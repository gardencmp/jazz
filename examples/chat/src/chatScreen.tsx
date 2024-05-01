import { ID } from 'jazz-tools';
import { Chat, Message, useCoState } from './app.tsx';

export function ChatScreen(props: { chatID: ID<Chat> }) {
  const chat = useCoState(Chat, props.chatID);

  if (!chat) return <div>Loading...</div>;

  return <div className='w-full max-w-xl h-full flex flex-col items-stretch'>
    {chat.map((msg) => (
      msg && <ChatBubble msg={msg} key={msg.id} />
    ))}
    <ChatInput
      onSubmit={(text) => {
        const message = new Message(
          { text }, { owner: chat._owner }
        );
        chat.push(message);
      }}
    />
  </div>;
}

function ChatBubble(props: { msg: Message }) {
  const lastEdit = props.msg._edits.text;
  const align = lastEdit.by?.isMe ? 'items-end' : 'items-start';

  return <div className={`${align} flex flex-col`}>
    <div className='rounded-xl bg-stone-100 dark:bg-stone-700 dark:text-white py-2 px-4 mt-2 min-w-[5rem]'>
      { props.msg.text }
    </div>
    <div className='text-xs text-neutral-500 ml-2'>
      { lastEdit.by?.profile?.name }{' '}
      { lastEdit.madeAt?.toLocaleTimeString() }
    </div>
  </div>;
}

function ChatInput(props: { onSubmit: (text: string) => void }) {
  return <input
    placeholder='Type a message and press Enter'
    className='rounded p-2 border mt-auto dark:bg-black dark:text-white dark:border-stone-700'
    onKeyDown={({ key, currentTarget: input }) => {
      if (key !== 'Enter' || !input.value) return;
      props.onSubmit(input.value);
      input.value = '';
    }}
  />;
}
