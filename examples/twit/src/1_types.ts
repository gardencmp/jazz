import { CoMap, CoList, Media, CoStream, Account } from "cojson";

export type Twit = CoMap<{
    text?: string;
    images?: CoList<Media.ImageDefinition>;
    likes: CoStream<"❤️" | null>;
    quotedPost?: Twit["id"];
    replies: CoStream<Twit["id"]>;
    isRepostedOrQuotedIn: CoStream<Twit["id"]>;
    isReplyTo?: Twit["id"];
}>;

export type TwitProfile = CoMap<{
    name: string;
    bio: string;
    avatar?: Media.ImageDefinition;
    twits: CoList<Twit>;
    follows: CoList<Account>;
}>;
