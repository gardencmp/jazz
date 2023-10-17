import React from 'react';
import { Link } from 'react-router-dom';
import {
  ButtonWithCount,
  ProfilePicImg,
  ReactionsContainer,
  RepliesContainer,
  SubtleRelativeTimeAgo,
  TwitContainer,
  TwitWithRepliesContainer,
  TwitImg,
  TwitImgGallery,
  TwitHeader,
  TwitBody,
  TwitText,
} from './basicComponents/index.tsx';
import { Twit, TwitProfile } from './1_dataModel.ts';
import { BrowserImage } from 'jazz-browser-media-images';
import { HeartIcon, MessagesSquareIcon } from 'lucide-react';
import { CreateTwitForm } from './6_CreateTwitForm.tsx';
import { Resolved } from 'jazz-react';

export function TwitComponent({
  twit,
  alreadyInReplies: alreadyInReplies
}: {
  twit?: Resolved<Twit>;
  alreadyInReplies?: boolean;
}) {
  const [showReplyForm, setShowReplyForm] = React.useState(false);

  const posterProfile = twit?.meta.edits.text?.by?.profile as Resolved<TwitProfile> | undefined;
  const isTopLevel = !twit?.isReplyTo || alreadyInReplies;

  return (
    <TwitWithRepliesContainer isTopLevel={isTopLevel}>
      <TwitContainer>
        <ProfilePicImg
          src={posterProfile?.avatar?.as(BrowserImage)?.highestResSrcOrPlaceholder}
          linkTo={'/' + posterProfile?.id}
          initial={posterProfile?.name[0]}
          size={twit?.isReplyTo && "sm"}
        />

        <TwitBody>
          <TwitHeader>
            <Link to={'/' + posterProfile?.id} className="font-bold hover:underline">
              {posterProfile?.name}
            </Link>
            <SubtleRelativeTimeAgo dateTime={twit?.meta.edits.text?.at} />
          </TwitHeader>

          <TwitText style={posterProfile?.twitStyle}>
            {/* This is where the tweet text goes */}
            {twit?.text}
          </TwitText>

          {twit?.images && (
            <TwitImgGallery>
              {twit.images.map((image, idx) => (
                <TwitImg src={image?.as(BrowserImage)?.highestResSrcOrPlaceholder} key={image?.id || idx} />
              ))}
            </TwitImgGallery>
          )}

          <ReactionsContainer>
            <ButtonWithCount
              active={twit?.likes?.me?.last === '❤️'}
              onClick={() => twit?.likes?.push(twit?.likes?.me?.last ? null : '❤️')}
              count={twit?.likes?.perAccount.filter(([, liked]) => liked.last === '❤️').length || 0}
              icon={<HeartIcon size="18" />}
              activeIcon={<HeartIcon color="red" size="18" fill="red" />}
            />
            <ButtonWithCount
              onClick={() => setShowReplyForm(s => !s)}
              count={twit?.replies?.perAccount.flatMap(([, byAccount]) => byAccount.all).length || 0}
              icon={<MessagesSquareIcon size="18" />}
            />
          </ReactionsContainer>
        </TwitBody>
      </TwitContainer>

      <RepliesContainer>
        {showReplyForm && (
          <CreateTwitForm
            inReplyTo={twit}
            onSubmit={() => setShowReplyForm(false)}
            className={'mt-5 ' + (isTopLevel ? 'ml-14' : 'ml-12')}
          />
        )}

        {twit?.replies?.perAccount
          .flatMap(([, byAccount]) => byAccount.all)
          .sort((a, b) => b.at.getTime() - a.at.getTime())
          .map(replyEntry => (
            <TwitComponent twit={replyEntry.value} key={replyEntry.value?.id} alreadyInReplies={!!twit?.isReplyTo} />
          ))}
      </RepliesContainer>
    </TwitWithRepliesContainer>
  );
}
