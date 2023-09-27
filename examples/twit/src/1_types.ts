import { CoMap, CoList, Media, CoStream, Group, ProfileMeta, AccountMigration, EVERYONE } from 'cojson';

export type Twit = CoMap<{
  text?: string;
  images?: ListOfImages['id'];
  likes: LikeStream['id'];
  quotedPost?: Twit['id'];
  replies: ReplyStream['id'];
  isRepostedIn: RepostedInStream['id'];
  isReplyTo?: Twit['id'];
}>;

export type ListOfImages = CoList<Media.ImageDefinition['id']>;
export type LikeStream = CoStream<'❤️' | null>;
export type ReplyStream = CoStream<Twit['id']>;
export type RepostedInStream = CoStream<Twit['id']>;

export type ListOfTwits = CoList<Twit['id']>;
export type ListOfProfiles = CoList<TwitProfile['id']>;

export type TwitProfile = CoMap<
  {
    name: string;
    bio: string;
    avatar?: Media.ImageDefinition['id'];
    twits: ListOfTwits['id'];
    following: ListOfProfiles['id'];
    followers: ListOfProfiles['id'];
    twitStyle?: {fontFamily: string; color: string};
  },
  ProfileMeta
>;

export type TwitAccountRoot = CoMap<{
  peopleWhoCanSeeMyTwits: Group['id'];
  peopleWhoCanSeeMyFollows: Group['id'];
  peopleWhoCanFollowMe: Group['id'];
  peopleWhoCanInteractWithMe: Group['id'];
}>;

export const migration: AccountMigration<TwitProfile, TwitAccountRoot> = (account, profile) => {
  if (!account.get('root')) {
    const peopleWhoCanSeeMyTwits = account.createGroup();
    const peopleWhoCanSeeMyFollows = account.createGroup();
    const peopleWhoCanFollowMe = account.createGroup();
    const peopleWhoCanInteractWithMe = account.createGroup();

    peopleWhoCanFollowMe?.addMember(EVERYONE, 'writer');
    peopleWhoCanSeeMyTwits?.addMember(EVERYONE, 'reader');
    peopleWhoCanSeeMyFollows?.addMember(EVERYONE, 'reader');
    peopleWhoCanInteractWithMe?.addMember(EVERYONE, 'writer');

    const root = account.createMap<TwitAccountRoot>({
      peopleWhoCanSeeMyTwits: peopleWhoCanSeeMyTwits.id,
      peopleWhoCanSeeMyFollows: peopleWhoCanSeeMyFollows.id,
      peopleWhoCanFollowMe: peopleWhoCanFollowMe.id,
      peopleWhoCanInteractWithMe: peopleWhoCanInteractWithMe.id
    });

    account.set('root', root.id);

    profile.set('twits', peopleWhoCanSeeMyTwits.createList<ListOfTwits>().id, 'trusting');
    profile.set('following', peopleWhoCanSeeMyFollows.createList<ListOfProfiles>().id, 'trusting');
    profile.set('followers', peopleWhoCanFollowMe.createList<ListOfProfiles>().id, 'trusting');
    console.log('MIGRATION SUCCESSFUL!');
  }
};
