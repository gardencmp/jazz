import { CoMap, FileStream, co } from "jazz-tools";

export class UploadedFile extends CoMap {
  file = co.ref(FileStream);
  syncCompleted = co.boolean;
  coMapDownloaded = co.boolean;
}
