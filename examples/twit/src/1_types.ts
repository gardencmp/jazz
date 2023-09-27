import { CoMap, CoList, Media, CoStream, Account, Group } from "cojson";
import { ProfileMeta } from "cojson/dist/coValues/account";

export type Twit = CoMap<{
    text?: string;
    images?: CoList<Media.ImageDefinition["id"]>["id"];
    likes: CoStream<"❤️" | null>["id"];
    quotedPost?: Twit["id"];
    replies: CoStream<Twit["id"]>["id"];
    isRepostedOrQuotedIn: CoStream<Twit["id"]>["id"];
    isReplyTo?: Twit["id"];
}>;

export type ListOfTwits = CoList<Twit["id"]>;
export type ListOfProfiles = CoList<TwitProfile["id"]>;

export type TwitProfile = CoMap<{
    name: string;
    bio: string;
    avatar?: Media.ImageDefinition["id"];
    twits: ListOfTwits["id"];
    follows: ListOfProfiles["id"];
}, ProfileMeta>;

export type TwitAccountRoot = CoMap<{
    peopleWhoCanSeeMyTwits: Group["id"];
    peopleWhoCanSeeMyFollows: Group["id"];
}>;