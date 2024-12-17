import { ID } from "jazz-tools";
import { WaitingRoom } from "./schema";

export type StartGameMessage = {
  type: "startGame";
  value: ID<WaitingRoom>;
};
