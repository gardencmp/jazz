import { Data } from "effect";

export class CoValueUnavailableError extends Data.TaggedError("CoValueUnavailableError") {}
export class UnknownCoValueLoadError extends Data.TaggedError("UnknownCoValueLoadError")<{
  cause: unknown
}> {}