import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useJazz, useAutoSub } from 'jazz-react';
import QRCode from 'qrcode';
import {
  BioInput,
  ChooseProfilePicInput,
  FollowerStatsContainer,
  Popover,
  ProfileName,
  ProfilePicImg,
  ProfileTitleContainer,
  SmallInlineButton
} from './basicComponents/index.tsx';
import { TwitAccountRoot, TwitProfile } from './1_dataModel.ts';
import { CoID } from 'cojson';
import { BrowserImage, createImage } from 'jazz-browser-media-images';
import { FollowButton, FollowerList, FollowingList } from './7_FollowStuff.tsx';
import { CreateTwitForm } from './6_CreateTwitForm.tsx';
import { TwitComponent } from './4_TwitComponent.tsx';
import { PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';

export function ProfilePage() {
  const { profileId } = useParams<{ profileId: CoID<TwitProfile> }>();
  const { me } = useJazz<TwitProfile, TwitAccountRoot>();

  const profile = useAutoSub(profileId);
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
      <div className="py-2 mb-5 flex gap-4">
        <div className="flex flex-col items-stretch">
          <ProfilePicImg
            src={profile?.avatar?.as(BrowserImage)?.highestResSrcOrPlaceholder}
            initial={profile?.name[0]}
            size="xxl"
          />
          {isMe && (
            <ChooseProfilePicInput
              onChange={(file: File) =>
                me.root?.peopleWhoCanSeeMyContent &&
                createImage(file, me.root.peopleWhoCanSeeMyContent, 256).then(image => {
                  me.profile?.set({ avatar: image.id }, 'trusting');
                })
              }
            />
          )}
        </div>
        <div className="grow">
          <ProfileTitleContainer>
            <ProfileName>{profile?.name}</ProfileName>
            {!isMe && <FollowButton profile={profile} />}
          </ProfileTitleContainer>

          <div>
            {isMe ? (
              <BioInput
                value={profile?.bio}
                onChange={newBio => {
                  profile?.set({ bio: newBio }, 'trusting');
                  // prettier-ignore
                  if (newBio.startsWith('{')) { profile?.set('twitStyle', JSON.parse(newBio), 'trusting'); } else { profile?.set('twitStyle', undefined, 'trusting'); }
                }}
              />
            ) : (
              profile?.bio || '(No bio)'
            )}
          </div>

          <FollowerStatsContainer>
            <Popover>
              <PopoverTrigger>
                <SmallInlineButton>
                  {profile?.followers?.perAccount?.filter(([, status]) => status.last).length} Followers
                </SmallInlineButton>
              </PopoverTrigger>
              <PopoverContent>
                <FollowerList profile={profile} />
              </PopoverContent>
            </Popover>
            <span className="hidden md:block">&mdash;</span> <br className="md:hidden" />
            <Popover>
              <PopoverTrigger>
                <SmallInlineButton>{new Set(profile?.following || []).size} Following</SmallInlineButton>
              </PopoverTrigger>
              <PopoverContent>
                <FollowingList profile={profile} />
              </PopoverContent>
            </Popover>
          </FollowerStatsContainer>
        </div>

        {isMe && <img src={qr} className="rounded w-28 h-28 -mr-3 dark:invert max-sm:w-16 max-sm:h-16" />}
      </div>

      {isMe && <CreateTwitForm className="mb-4" />}

      {profileTwitsAndRepliedToTwits?.map(twit => twit && <TwitComponent twit={twit} key={twit?.id} />)}
    </div>
  );
}
