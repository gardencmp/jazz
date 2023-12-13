import { ID } from 'jazz-js';
import { Chat, Message } from './schema.ts';
import { useCoState } from './app.tsx';

export function ChatWindow(props: { chatId: ID<Chat> }) {
  const chat = useCoState(Chat, props.chatId);

  return chat ? <div className='w-full max-w-xl h-full flex flex-col items-stretch'>
    {
      chat.map((msg, i) => (
        <ChatBubble key={msg?.id}
          text={msg?.text}
          by={chat.meta.edits[i].by?.profile?.name}
          byMe={chat.meta.edits[i].by?.isMe}
          at={chat.meta.edits[i].at} />
      ))
    }
    <ChatInput onSubmit={(text) => {
      chat.push(new Message({ text }, { owner: chat.meta.owner }));
    }}/>
  </div> : <div>Loading...</div>;
}

function ChatBubble(props: { text?: string, by?: string, at?: Date, byMe?: boolean }) {
  return <div className={`${props.byMe ? 'items-end' : 'items-start'} flex flex-col`}>
    <div className='rounded-xl bg-stone-100 dark:bg-stone-700 dark:text-white py-2 px-4 mt-2 min-w-[5rem]'>
      { props.text }
    </div>
    <div className='text-xs text-neutral-500 ml-2'>
      { props.by } { props.at?.getHours() }:{ props.at?.getMinutes() }
    </div>
  </div>;
}

function ChatInput(props: { onSubmit: (text: string) => void }) {
  return <input className='rounded p-2 border mt-auto dark:bg-black dark:text-white dark:border-stone-700'
    placeholder='Type a message and press Enter'
    onKeyDown={({ key, currentTarget: input }) => {
      if (key !== 'Enter' || !input.value) return;
      props.onSubmit(input.value);
      input.value = '';
    }}/>
}
