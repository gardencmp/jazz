import { ID } from 'jazz-js';
import { Chat, Message , useCoState } from './app.tsx';
import { useEffect } from 'react';

export function ChatWindow(props: { chatId: ID<Chat> }) {
  const chat = useCoState(Chat, props.chatId);

  return chat ? <div className='w-full max-w-xl h-full flex flex-col items-stretch'>
    {
      chat.map((msg, i) => msg && (
        <ChatBubble key={msg.id}
          text={msg.text}
          by={chat._edits[i].by?.profile?.name}
          byMe={chat._edits[i].by?.isMe}
          madeAt={chat._edits[i].madeAt} />
      ))
    }
    <ChatInput onSubmit={(text) => {
      chat.push(new Message({ text }, { owner: chat._owner }));
    }}/>
  </div> : <div>Loading...</div>;
}

function ChatBubble(props: { text?: string, by?: string, madeAt?: Date, byMe?: boolean }) {
  return <div className={`${props.byMe ? 'items-end' : 'items-start'} flex flex-col`}>
    <div className='rounded-xl bg-stone-100 dark:bg-stone-700 dark:text-white py-2 px-4 mt-2 min-w-[5rem]'>
      { props.text }
    </div>
    <div className='text-xs text-neutral-500 ml-2'>
      { props.by } { props.madeAt?.toLocaleTimeString() }
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
