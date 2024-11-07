import { BinaryCoStream, CoMap, co } from "jazz-tools";

export class UploadedFile extends CoMap {
  file = co.ref(BinaryCoStream);
  syncCompleted = co.boolean;
  coMapDownloaded = co.boolean;
}
