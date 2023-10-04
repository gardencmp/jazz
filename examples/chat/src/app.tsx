import { CoMap, CoList } from 'cojson';
// Our data model: a chat is a collaborative list of messages
export type Chat = CoList<Message['id']>;
export type Message = CoMap<{ text: string }>;

import { WithJazz, useJazz, DemoAuth } from 'jazz-react';
import ReactDOM from 'react-dom/client';
import { HashRoute } from 'hashroute';
import { ChatWindow } from './chatWindow.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <WithJazz auth={DemoAuth({ appName: 'Chat' })}>
    <App />
  </WithJazz>,
);

function App() {
  const { logOut } = useJazz();
  return <div className='flex flex-col items-center justify-between w-screen h-screen p-2 dark:bg-black dark:text-white'>
    <button onClick={() => { logOut() }} className='rounded mb-5 px-2 py-1 bg-stone-200 dark:bg-stone-800 dark:text-white self-end'>
      Log Out
    </button>
    {HashRoute({
      '/': <Home />,
      '/:id': (id) => <ChatWindow chatId={id as Chat['id']} />,
    }, { reportToParentFrame: true })}
  </div>
}

function Home() {
  const { me } = useJazz();
  // Groups determine access rights to values they own.
  const createChat = () => {
    const group = me.createGroup().addMember('everyone', 'writer');
    const chat = group.createList<Chat>();
    location.hash = '/' + chat.id;
  };

  return <button onClick={createChat} className='rounded py-2 px-4 bg-stone-200 dark:bg-stone-800 dark:text-white my-auto'>
    Create New Chat
  </button>
}
