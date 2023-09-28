import { useCallback } from 'react';
import { useJazz } from 'jazz-react';
import { Button, ProfilePicImg } from './basicComponents/index.tsx';
import { TwitAccountRoot, TwitProfile } from './1_dataModel.ts';
import { Queried } from 'cojson';
import { Link } from 'react-router-dom';
import { BrowserImage } from 'jazz-browser-media-images';

export function FollowButton({ profile }: { profile?: Queried<TwitProfile> }) {
  const { me } = useJazz<TwitProfile, TwitAccountRoot>();

  const alreadyFollowing = profile?.followers?.perAccount?.some(([acc, status]) => acc === me.id && !!status.last);
  const theyFollowMe = profile?.following?.some(f => f?.id === me.profile?.id);

  const followOrUnfollow = useCallback(() => {
    if (!profile?.followers || !me.profile?.following) return;
    if (alreadyFollowing) {
      me.profile.following.delete(me.profile.following.findIndex(f => f?.id === profile.id));
      profile.followers.push(null);
    } else {
      me.profile.following.append(profile.id);
      profile.followers.push(me.profile.id);
    }
  }, [alreadyFollowing, me.profile, profile]);

  return profile?.id === me.profile?.id ? (
    <div className="ml-auto text-neutral-500">That's you!</div>
  ) : (
    <Button onClick={followOrUnfollow} className="ml-auto" variant={alreadyFollowing ? 'ghost' : 'default'}>
      {alreadyFollowing ? 'Unfollow' : theyFollowMe ? 'Follow Back' : 'Follow'}
    </Button>
  );
}

export function FollowerList({ profile }: { profile?: Queried<TwitProfile> }) {
  return (
    <div className="flex flex-col gap-4 p-4 bg-background rounded-lg border shadow-lg w-96 max-w-full m-2">
      {profile?.followers?.perAccount.map(([, followEntry]) => {
        const followerProfile = followEntry.last;
        // not following anymore?
        if (!followerProfile) return null;

        return (
          <div key={followerProfile.id} className="flex items-center">
            <ProfilePicImg
              src={followerProfile?.avatar?.as(BrowserImage)?.highestResSrcOrPlaceholder}
              linkTo={'/' + followerProfile?.id}
              initial={followerProfile?.name[0]}
            />
            <Link to={'/' + followerProfile?.id} className="font-bold hover:underline">
              {followerProfile?.name}
            </Link>
            <FollowButton profile={followerProfile} />
          </div>
        );
      })}
    </div>
  );
}

export function FollowingList({ profile }: { profile?: Queried<TwitProfile> }) {
  return (
    <div className="flex flex-col gap-4 p-4 bg-background rounded-lg border shadow-lg w-96 max-w-full m-2">
      {[...new Set(profile?.following || [])].map(followingProfile => {
        return (
          <div key={followingProfile?.id} className="flex items-center">
            <ProfilePicImg
              src={followingProfile?.avatar?.as(BrowserImage)?.highestResSrcOrPlaceholder}
              linkTo={'/' + followingProfile?.id}
              initial={followingProfile?.name[0]}
            />
            <Link to={'/' + followingProfile?.id} className="font-bold hover:underline">
              {followingProfile?.name}
            </Link>
            <FollowButton profile={followingProfile} />
          </div>
        );
      })}
    </div>
  );
}
