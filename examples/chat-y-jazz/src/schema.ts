import { CoList, CoMap, ImageDefinition, co } from "jazz-tools";

export class Message extends CoMap {
  text = co.string;
  image = co.optional.ref(ImageDefinition);
}

export class Chat extends CoList.Of(co.ref(Message)) {}
