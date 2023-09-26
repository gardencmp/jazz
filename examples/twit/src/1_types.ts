import { CoMap, CoList, Media, CoStream, Account } from "cojson";

export type Twit = CoMap<{
    text?: string;
    images?: CoList<Media.ImageDefinition["id"]>["id"];
    likes: CoStream<"❤️" | null>["id"];
    quotedPost?: Twit["id"];
    replies: CoStream<Twit["id"]>["id"];
    isRepostedOrQuotedIn: CoStream<Twit["id"]>["id"];
    isReplyTo?: Twit["id"];
}>;

export type TwitProfile = CoMap<{
    name: string;
    bio: string;
    avatar?: Media.ImageDefinition["id"];
    twits: CoList<Twit["id"]>["id"];
    follows: CoList<Account["id"]>["id"];
}>;
