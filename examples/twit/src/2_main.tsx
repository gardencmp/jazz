import ReactDOM from 'react-dom/client';
import { RouterProvider, createHashRouter } from 'react-router-dom';
import './index.css';

import { AccountMigration } from 'cojson';
import { WithJazz, useJazz } from 'jazz-react';
import { LocalAuth } from 'jazz-react-auth-local';

import { Button, ThemeProvider, TitleAndLogo } from './basicComponents/index.tsx';
import { PrettyAuthUI } from './components/Auth.tsx';

import { migration } from './1_dataModel.ts';
import { AllTwitsFeed, FollowingFeed } from './3_ChronoFeed.tsx';
import { ProfilePage } from './5_ProfilePage.tsx';

const appName = 'Jazz Twit Example';

const auth = LocalAuth({
  appName,
  Component: PrettyAuthUI
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
    <ThemeProvider>
      <TitleAndLogo name={appName} />
      <div className="flex flex-col h-full items-stretch justify-start gap-10 pt-10 pb-10 px-5 w-full max-w-xl mx-auto">
        <WithJazz auth={auth} migration={migration as AccountMigration}>
          <App />
        </WithJazz>
      </div>
    </ThemeProvider>
  // </React.StrictMode>
);

function App() {
  const { me, logOut } = useJazz();

  const router = createHashRouter([
    {
      path: '/',
      element: <AllTwitsFeed />
    },
    {
      path: '/following',
      element: <FollowingFeed />
    },
    {
      path: '/:profileId',
      element: <ProfilePage />
    },
    {
      path: '/me',
      loader: () => router.navigate('/' + me.profile?.id)
    }
  ]);

  return (
    <>
      <div className="flex gap-2">
        <Button onClick={() => router.navigate('/')} variant="link" className="-ml-3">
          Home
        </Button>
        <Button onClick={() => router.navigate('/following')} variant="link" className="-ml-3">
          Following
        </Button>
        <Button onClick={() => router.navigate('/me')} variant="link" className="ml-auto">
          My Profile
        </Button>
        <Button onClick={() => router.navigate('/').then(logOut)} variant="outline">
          Log Out
        </Button>
      </div>
      <RouterProvider router={router} />
    </>
  );
}
