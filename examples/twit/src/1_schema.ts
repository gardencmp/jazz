import { Co, CoList, CoListSchema, CoValueSchema, S,  } from 'jazz-tools';


export class Twit extends Co.map({
  text: S.optional(S.string),
  // images: S.optional(ListOfImages),
  // likes: LikeStream,
  // replies: S.suspend((): S.Schema<ReplyStream> => ReplyStream),
  isReplyTo: S.optional(S.suspend((): typeof Twit => Twit)),
}).as<Twit>() {}


export class ListOfImages extends Co.list(Co.media.imageDef).as<ListOfImages>() {}
export class LikeStream extends Co.stream(S.literal('❤️', null)).as<LikeStream>() {}
// export class ReplyStream extends Co.stream(Twit).as<ReplyStream>() {}

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

export const ALL_TWEETS_LIST_ID = "co_zQEhxDTvZt3f4vWKqVNj9TCTRs4" as ListOfTwits['id'];

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
