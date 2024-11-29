import { CoFeed, co } from "jazz-tools";

export const ReactionTypes = [
  "aww",
  "love",
  "haha",
  "wow",
  "tiny",
  "chonkers",
] as const;

export type ReactionType = (typeof ReactionTypes)[number];

export class Reactions extends CoFeed.Of(co.json<ReactionType>()) {}
