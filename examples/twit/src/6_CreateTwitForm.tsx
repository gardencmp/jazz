import React, { useCallback, useEffect } from 'react';
import { Resolved, useJazz, useSyncedValue } from 'jazz-react';
import { AddTwitPicsInput, TwitImg, TwitTextInput } from './basicComponents/index.tsx';
import { ALL_TWEETS_LIST_ID, LikeStream, ListOfImages, ReplyStream, Twit, TwitAccountRoot, TwitProfile } from './1_dataModel.ts';
import { createImage } from 'jazz-browser-media-images';

export function CreateTwitForm(
  props: {
    inReplyTo?: Resolved<Twit>;
    onSubmit?: () => void;
    className?: string;
  } = {}
) {
  const { me } = useJazz<TwitProfile, TwitAccountRoot>();
  const allTwits = useSyncedValue(ALL_TWEETS_LIST_ID);

  const [pics, setPics] = React.useState<File[]>([]);

  const onSubmit = useCallback(
    (twitText: string) => {
      const audience = me.root?.peopleWhoCanSeeMyContent;
      const interactors = me.root?.peopleWhoCanInteractWithMe;
      if (!audience || !interactors) return;

      const twit = audience.createMap<Twit>({
        text: twitText,
        likes: interactors.createStream<LikeStream>().id,
        replies: interactors.createStream<ReplyStream>().id
      });

      me.profile?.twits?.prepend(twit?.id as Twit['id']);

      if (!props.inReplyTo) {
        allTwits?.prepend(twit.id);
      }

      if (props.inReplyTo) {
        props.inReplyTo.replies?.push(twit.id);
        twit.set({ isReplyTo: props.inReplyTo.id });
      }

      if (pics.length > 0) {
        Promise.all(pics.map(pic => createImage(pic, twit.group, 1024))).then(createdPics => {
          twit.set({ images: audience.createList<ListOfImages>(createdPics.map(pic => pic.id)).id });
        });
      }

      setPics([]);
      props.onSubmit?.();
    },
    [me.profile?.twits, me.root?.peopleWhoCanSeeMyContent, me.root?.peopleWhoCanInteractWithMe, props, pics, allTwits]
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
