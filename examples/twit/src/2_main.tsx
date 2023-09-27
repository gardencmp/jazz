import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Link, RouterProvider, createHashRouter, useNavigate, useParams } from 'react-router-dom';
import './index.css';

import { WithJazz, useJazz, useSyncedQuery } from 'jazz-react';
import { LocalAuth } from 'jazz-react-auth-local';
import QRCode from 'qrcode';

import {
  AddTwitPicsInput,
  BioInput,
  Button,
  ButtonWithCount,
  ChooseProfilePicInput,
  FollowerStatsContainer,
  LargeProfilePicImg,
  ProfileName,
  ProfilePicImg,
  ProfileTitleContainer,
  ReactionsAndReplyContainer,
  ReactionsContainer,
  RepliesContainer,
  SubtleRelativeTimeAgo,
  ThemeProvider,
  TitleAndLogo,
  TwitImg,
  TwitTextInput
} from './basicComponents/index.tsx';
import { PrettyAuthUI } from './components/Auth.tsx';
import {
  LikeStream,
  ListOfImages,
  ReplyStream,
  RepostedInStream,
  Twit,
  TwitAccountRoot,
  TwitProfile,
  migration
} from './1_types.ts';
import { AccountMigration, CoID, Queried } from 'cojson';
import { BrowserImage, createImage } from 'jazz-browser-media-images';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en.json';
import { HeartIcon, MessagesSquareIcon } from 'lucide-react';
TimeAgo.addDefaultLocale(en);

const appName = 'Jazz Twit Example';

const auth = LocalAuth({
  appName,
  Component: PrettyAuthUI
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <TitleAndLogo name={appName} />
      <div className="flex flex-col h-full items-stretch justify-start gap-10 pt-10 pb-10 px-5 w-full max-w-xl mx-auto">
        <WithJazz auth={auth} migration={migration as AccountMigration}>
          <App />
        </WithJazz>
      </div>
    </ThemeProvider>
  </React.StrictMode>
);

/**
 * Routing in `<App/>`
 *
 * <App> is the main app component, handling client-side routing based
 * on the CoValue ID (CoID) of our TodoProject, stored in the URL hash
 * - which can also contain invite links.
 */

function App() {
  // logOut logs out the AuthProvider passed to `<WithJazz/>` above.
  const { logOut } = useJazz();

  const router = createHashRouter([
    {
      path: '/',
      element: <ChronoFeedUI />
    },
    {
      path: '/me',
      element: <MyProfile />
    },
    {
      path: '/:profileId',
      element: <UserProfile />
    }
  ]);

  return (
    <>
      <div className="flex gap-2">
        <Button onClick={() => router.navigate('/')} variant="link" className="-ml-3">
          Home
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

export function MyProfile() {
  const { me } = useJazz<TwitProfile, TwitAccountRoot>();
  const navigate = useNavigate();

  setTimeout(() => me.profile?.id &&  navigate('/' + me.profile.id), 0);

  return me.profile && <ProfileUI profileId={me.profile.id} />;
}

export function UserProfile() {
  const { profileId } = useParams<{ profileId: CoID<TwitProfile> }>();

  return profileId && <ProfileUI profileId={profileId} />;
}

export function ProfileUI({ profileId }: { profileId: CoID<TwitProfile> }) {
  const { me } = useJazz<TwitProfile, TwitAccountRoot>();

  const profile = useSyncedQuery(profileId);
  const isMe = profile?.id == me.profile?.id;

  const profileTwitsAndRepliedToTwits = useMemo(() => {
    return profile?.twits?.map((twit, _, allTwits) =>
      twit?.isReplyTo
        ? allTwits.some(
            tw =>
              tw?.id === twit?.isReplyTo?.id ||
              tw?.id === twit?.isReplyTo?.isReplyTo?.id ||
              tw?.id === twit?.isReplyTo?.isReplyTo?.isReplyTo?.id
          )
          ? null
          : twit?.isReplyTo
        : twit
    );
  }, [profile?.twits]);

  const [qr, setQr] = useState<string>('');
  useEffect(() => {
    QRCode.toDataURL(
      window.location.protocol + '//' + window.location.host + window.location.pathname + '#/' + profile?.id,
      {
        errorCorrectionLevel: 'L'
      }
    ).then(setQr);
  }, [profile?.id]);

  return (
    <div>
      <div className="py-2 mb-5 flex gap-2">
        <div className="flex flex-col items-stretch">
          <LargeProfilePicImg src={profile?.avatar?.as(BrowserImage)?.highestResSrcOrPlaceholder} />
          {isMe && (
            <ChooseProfilePicInput
              onChange={(file: File) =>
                me.root?.peopleWhoCanSeeMyTwits &&
                createImage(file, me.root.peopleWhoCanSeeMyTwits.group, 256).then(image => {
                  me.profile?.set({ avatar: image.id }, 'trusting');
                })
              }
            />
          )}
        </div>
        <div className="grow">
          <ProfileTitleContainer>
            <ProfileName>{profile?.name}</ProfileName>
            {!isMe && (
              <Button
                onClick={() => {
                  if (!profile?.followers || !me.profile?.following) return;
                  if (profile.followers.some(f => f?.id === me.profile?.id)) {
                    me.profile.following.delete(me.profile.following.findIndex(f => f?.id === profile.id));
                    profile.followers.delete(profile.followers.findIndex(f => f?.id === me.profile?.id));
                  } else {
                    me.profile.following.append(profile.id);
                    profile.followers.append(me.profile.id);
                  }
                }}
                className="ml-auto"
              >
                {profile?.followers?.some(f => f?.id === me.profile?.id) ? 'Unfollow' : 'Follow'}
              </Button>
            )}
          </ProfileTitleContainer>

          <div>
            {isMe ? (
              <BioInput
                value={profile?.bio}
                onChange={newBio => {
                  profile?.set({ bio: newBio }, 'trusting');
                  // prettier-ignore
                  if (newBio.startsWith('{')) {profile?.set('twitStyle', JSON.parse(newBio), 'trusting');} else {profile?.set('twitStyle', undefined, 'trusting');}
                }}
              />
            ) : (
              profile?.bio || '(No bio)'
            )}
          </div>

          <FollowerStatsContainer>
            {new Set(profile?.followers || []).size} Followers <span className='hidden md:block'>&mdash;</span><br className="md:hidden"/> {new Set(profile?.following || []).size}{' '}
            Following
          </FollowerStatsContainer>
        </div>

        {isMe && <img src={qr} className="rounded w-28 h-28 -mr-3 dark:invert max-sm:w-16 max-sm:h-16" />}
      </div>

      {isMe && <CreateTwitForm className="mb-4" />}

      {profileTwitsAndRepliedToTwits?.map(twit => twit && <TwitUI twit={twit} key={twit?.id} />)}
    </div>
  );
}

export function TwitUI({
  twit,
  alreadyInReplies: alreadyInReplies
}: {
  twit?: Queried<Twit>;
  alreadyInReplies?: boolean;
}) {
  const [showReplyForm, setShowReplyForm] = React.useState(false);

  const posterProfile = twit?.edits.text?.by?.profile as Queried<TwitProfile> | undefined;

  return (
    <div
      className={'py-2 flex flex-col items-stretch' + (twit?.isReplyTo && !alreadyInReplies ? ' ml-14' : ' border-t')}
    >
      <div className="flex gap-2">
        <ProfilePicImg
          src={posterProfile?.avatar?.as(BrowserImage)?.highestResSrcOrPlaceholder}
          smaller={!!twit?.isReplyTo}
        />
        <div className="grow flex flex-col items-stretch">
          <div className="flex items-baseline">
            {posterProfile && (
              <Link to={'/' + posterProfile.id} className="font-bold">
                {posterProfile.name}
              </Link>
            )}
            <SubtleRelativeTimeAgo dateTime={twit?.edits.text?.at} />
          </div>
          <div style={posterProfile?.twitStyle}>{twit?.text}</div>
          {twit?.quotedPost && (
            <div className="border rounded">
              <TwitUI twit={twit.quotedPost} />
            </div>
          )}
          {twit?.images && (
            <div className="flex gap-2 mt-2 max-w-full overflow-auto">
              {twit.images.map(image => (
                <TwitImg src={image?.as(BrowserImage)?.highestResSrcOrPlaceholder} key={image?.id} />
              ))}
            </div>
          )}
          <ReactionsAndReplyContainer>
            <ReactionsContainer>
              <ButtonWithCount
                active={twit?.likes?.me?.last === '❤️'}
                onClick={() => twit?.likes?.push(twit?.likes?.me?.last ? null : '❤️')}
                count={Object.values(twit?.likes?.perAccount || {}).filter(byAccount => byAccount.last === '❤️').length}
                icon={<HeartIcon size="18" />}
                activeIcon={<HeartIcon color="red" size="18" fill="red" />}
              />
              <ButtonWithCount
                onClick={() => setShowReplyForm(s => !s)}
                count={Object.values(twit?.replies?.perSession || {}).flatMap(perSession => perSession.all).length}
                icon={<MessagesSquareIcon size="18" />}
              />
            </ReactionsContainer>
          </ReactionsAndReplyContainer>
          {showReplyForm && (
            <CreateTwitForm inReplyTo={twit} onSubmit={() => setShowReplyForm(false)} className="mt-5" />
          )}
        </div>
      </div>
      <RepliesContainer>
        {Object.values(twit?.replies?.perAccount || {})
          .flatMap(byAccount => byAccount.all)
          .sort((a, b) => b.at.getTime() - a.at.getTime())
          .map(replyEntry => (
            <TwitUI twit={replyEntry.value} key={replyEntry.value?.id} alreadyInReplies={!!twit?.isReplyTo} />
          ))}
      </RepliesContainer>
    </div>
  );
}

export function ChronoFeedUI() {
  const { me } = useJazz<TwitProfile, TwitAccountRoot>();

  const myTwits = me.profile?.twits;

  const twitsFromFollows = useMemo(
    () => me.profile?.following?.flatMap(follow => follow?.twits || []) || [],
    [me.profile?.following]
  );

  const allTwitsSorted = useMemo(
    () =>
      [...(myTwits || []), ...twitsFromFollows]
        .flatMap(tw => (tw ? (tw.isReplyTo ? [] : tw) : []))
        .sort((a, b) => (b.edits.text?.at?.getTime() || 0) - (a.edits.text?.at?.getTime() || 0)),
    [myTwits, twitsFromFollows]
  );

  return (
    <div className="flex flex-col items-stretch">
      <CreateTwitForm className="mb-10" />
      <h1 className="text-2xl mb-4">From people you follow</h1>
      {allTwitsSorted?.map(twit => (
        <TwitUI twit={twit} key={twit.id} />
      ))}
    </div>
  );
}

export function CreateTwitForm(
  props: {
    inReplyTo?: Queried<Twit>;
    onSubmit?: () => void;
    className?: string;
  } = {}
) {
  const { me } = useJazz<TwitProfile, TwitAccountRoot>();

  const [pics, setPics] = React.useState<File[]>([]);

  const onSubmit = useCallback(
    (twitText: string) => {
      const audience = me.root?.peopleWhoCanSeeMyTwits;
      const interactors = me.root?.peopleWhoCanInteractWithMe;
      if (!audience || !interactors) return;

      const images = pics.length ? audience.createList<ListOfImages>() : undefined;

      const twit = audience.createMap<Twit>({
        text: twitText,
        likes: interactors.createStream<LikeStream>().id,
        replies: interactors.createStream<ReplyStream>().id,
        isRepostedIn: interactors.createStream<RepostedInStream>().id,
        images: images?.id
      });

      me.profile?.twits?.prepend(twit?.id as Twit['id']);

      if (props.inReplyTo) {
        props.inReplyTo.replies?.push(twit.id);
        twit.set({ isReplyTo: props.inReplyTo.id });
      }

      pics.forEach(pic => {
        createImage(pic, twit.group, 1024).then(image => {
          images!.append(image.id);
        });
      });

      setPics([]);
      props.onSubmit?.();
    },
    [me.profile?.twits, me.root?.peopleWhoCanSeeMyTwits, me.root?.peopleWhoCanInteractWithMe, props, pics]
  );

  const [picPreviews, setPicPreviews] = React.useState<string[]>([]);
  useEffect(() => {
    const previews = pics.map(pic => URL.createObjectURL(pic));
    setPicPreviews(previews);
    return () => previews.forEach(preview => URL.revokeObjectURL(preview));
  }, [pics]);

  return (
    <div className={props.className}>
      <TwitTextInput onSubmit={onSubmit} submitButtonLabel={props.inReplyTo ? 'Reply!' : 'Twit!'} />

      {picPreviews.length ? (
        <div className="flex gap-2 mt-2">
          {picPreviews.map(preview => (
            <TwitImg src={preview} />
          ))}
        </div>
      ) : (
        <AddTwitPicsInput
          onChange={(newPics: File[]) => {
            setPics(newPics);
          }}
        />
      )}
    </div>
  );
}
