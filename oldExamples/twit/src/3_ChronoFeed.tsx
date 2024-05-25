import { useEffect, useMemo, useState } from 'react';
import { useAutoSub, useJazz } from 'jazz-react';
import { ALL_TWEETS_LIST_ID, TwitAccountRoot, TwitProfile } from './1_schema.ts';
import { CreateTwitForm } from './6_CreateTwitForm.tsx';
import { TwitComponent } from './4_TwitComponent.tsx';
import { LazyLoadRow, MainH1 } from './basicComponents/index.tsx';

export function AllTwitsFeed() {
  const allTwits = useAutoSub(ALL_TWEETS_LIST_ID);

  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (!animate && allTwits?.length) {
      setTimeout(() => setAnimate(true), 1000);
    }
  }, [allTwits, animate])

  return (
    <div className="flex flex-col items-stretch">
      <CreateTwitForm className="mb-10" />
      <MainH1>
        All {allTwits?.length} Twits{' '}
        <span className="text-sm">
          {allTwits?.mapDeferred(({ loaded }) => loaded).filter(l => l).length || 0} loaded
        </span>
      </MainH1>
      {allTwits?.mapDeferred(twit => (
        <LazyLoadRow key={twit.id} animate={animate}>{() => <TwitComponent twit={twit.value()} />}</LazyLoadRow>
      ))}
    </div>
  );
}

export function FollowingFeed() {
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
        .sort((a, b) => (b.meta.edits.text?.at?.getTime() || 0) - (a.meta.edits.text?.at?.getTime() || 0)),
    [myTwits, twitsFromFollows]
  );

  return (
    <div className="flex flex-col items-stretch">
      <CreateTwitForm className="mb-10" />
      <MainH1>From people you follow</MainH1>
      {allTwitsSorted?.map(twit => (
        <TwitComponent twit={twit} key={twit.id} />
      ))}
    </div>
  );
}
