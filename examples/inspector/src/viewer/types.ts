import { CoID, RawCoValue } from "cojson";

export type PageInfo = {
  coId: CoID<RawCoValue>;
  name?: string;
};

export const isCoId = (coId: unknown): coId is CoID<RawCoValue> =>
  typeof coId === "string" && coId.startsWith("co_");
