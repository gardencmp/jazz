import { CoList, CoMap, co } from "jazz-tools";

export class Message extends CoMap {
  text = co.string;
}

export class Chat extends CoList.Of(co.ref(Message)) {}
