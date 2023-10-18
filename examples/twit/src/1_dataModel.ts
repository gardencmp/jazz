import { CoMap, CoList, Media, CoStream, Group, AccountMigration, EVERYONE, Profile } from 'cojson';

export type Twit = CoMap<{
  text?: string;
  images?: ListOfImages['id'];
  likes: LikeStream['id'];
  replies: ReplyStream['id'];
  isReplyTo?: Twit['id'];
}>;

export type ListOfImages = CoList<Media.ImageDefinition['id']>;
export type LikeStream = CoStream<'❤️' | null>;
export type ReplyStream = CoStream<Twit['id']>;

export type ListOfTwits = CoList<Twit['id']>;
export type ListOfProfiles = CoList<TwitProfile['id']>;
export type StreamOfFollowers = CoStream<TwitProfile['id'] | null>;

export type TwitProfile = Profile<
  {
    name: string;
    bio: string;
    avatar?: Media.ImageDefinition['id'];
    twits: ListOfTwits['id'];
    following: ListOfProfiles['id'];
    followers: StreamOfFollowers['id'];
    twitStyle?: { fontFamily: string; color: string };
  }
>;

export type TwitAccountRoot = CoMap<{
  peopleWhoCanSeeMyContent: Group['id'];
  peopleWhoCanInteractWithMe: Group['id'];
}>;

export const ALL_TWEETS_LIST_ID = "co_zAaZZBUGKhkxLuk3Wq1r9q16FSN" as ListOfTwits['id'];

export const migration: AccountMigration<TwitProfile, TwitAccountRoot> = (account, profile) => {
  if (!account.get('root')) {
    const peopleWhoCanSeeMyContent = account.createGroup();
    const peopleWhoCanInteractWithMe = account.createGroup();

    peopleWhoCanSeeMyContent?.addMember(EVERYONE, 'reader');
    peopleWhoCanInteractWithMe?.addMember(EVERYONE, 'writer');

    const root = account.createMap<TwitAccountRoot>({
      peopleWhoCanSeeMyContent: peopleWhoCanSeeMyContent.id,
      peopleWhoCanInteractWithMe: peopleWhoCanInteractWithMe.id
    });

    account.set('root', root.id);

    profile.set('twits', peopleWhoCanSeeMyContent.createList<ListOfTwits>().id, 'trusting');
    profile.set('following', peopleWhoCanSeeMyContent.createList<ListOfProfiles>().id, 'trusting');
    profile.set('followers', peopleWhoCanInteractWithMe.createStream<StreamOfFollowers>().id, 'trusting');
    console.log('MIGRATION SUCCESSFUL!');
  }
};
