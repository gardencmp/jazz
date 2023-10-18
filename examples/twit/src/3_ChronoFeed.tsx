import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useAutoSub, useJazz } from 'jazz-react';
import { ALL_TWEETS_LIST_ID, TwitAccountRoot, TwitProfile } from './1_dataModel.ts';
import { CreateTwitForm } from './6_CreateTwitForm.tsx';
import { TwitComponent } from './4_TwitComponent.tsx';
import { LazyLoadRow, MainH1 } from './basicComponents/index.tsx';

import InfiniteScroll from 'react-infinite-scroll-component';

// export function AllTwitsFeed() {
//   const allTwits = useAutoSub(ALL_TWEETS_LIST_ID);

//   const [nLoaded, setNLoaded] = useState(20);
//   const visibleTwits = useMemo(
//     () => allTwits?.slice(allTwits.length - nLoaded, allTwits.length).reverse() ?? [],
//     [allTwits, nLoaded]
//   );

//   const [height, setHeight] = useState(0);

//   const containerRef = useRef<HTMLDivElement>(null);

//   useLayoutEffect(() => {
//     if (!containerRef.current) return;
//     const top = containerRef.current.getBoundingClientRect().top;
//     const totalHeight = window.innerHeight;
//     console.log('totalHeight', totalHeight, 'top', top);
//     setHeight(totalHeight - top - 40);
//   }, []);

//   return (
//     <div className="flex flex-col items-stretch">
//       <CreateTwitForm className="mb-10" />
//       <MainH1>All {allTwits?.length} Twits</MainH1>
//       <div ref={containerRef} className="relative">
//         {(allTwits?.length || 0) - visibleTwits.length > 0 && (
//           <div className='absolute left-0 right-0 top-0 flex justify-center z-10'>
//           <div className=" bg-white dark:bg-black shadow-xl rounded-full px-4 py-2 border border-neutral-200 dark:border-neutral-800">{(allTwits?.length || 0) - visibleTwits.length} more Twits ☝︎</div>
//           </div>
//         )}
//         <InfiniteScroll
//           key={height}
//           dataLength={visibleTwits.length}
//           next={() => {
//             console.log('load more');
//             setNLoaded(n => n + 10);
//           }}
//           height={height}
//           style={{ display: 'flex', flexDirection: 'column-reverse' }} //To put endMessage and loader to the top.
//           inverse={true} //
//           hasMore={true}
//           loader={<></>}
//           scrollableTarget="scrollableDiv"
//         >
//           <div className="flex-1"></div>
//           {visibleTwits
//             // ?.filter((tw): tw is Exclude<typeof tw, undefined> => !!tw)
//             .map((twit, idx) => (
//               <TwitComponent twit={twit} key={twit?.id ?? idx} />
//             ))}
//         </InfiniteScroll>
//       </div>
//     </div>
//   );
// }

export function AllTwitsFeed() {
  const allTwits = useAutoSub(ALL_TWEETS_LIST_ID);

  return (
    <div className="flex flex-col items-stretch">
      <CreateTwitForm className="mb-10" />
      <MainH1>All {allTwits?.length} Twits <span className='text-sm'>{allTwits?.filter(tw => !!tw).length || 0} loaded</span></MainH1>
      {allTwits?.filter(tw => !!tw).map((twit, idx) => (
        <LazyLoadRow key={twit?.id ?? idx}>
          <TwitComponent twit={twit}  />
        </LazyLoadRow>
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
