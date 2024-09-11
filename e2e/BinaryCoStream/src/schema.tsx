import { BinaryCoStream, co, CoMap } from "jazz-tools";

export class UploadedFile extends CoMap {
  file = co.ref(BinaryCoStream);
  syncCompleted = co.boolean;
}
