import { UploadedFile } from "src/schema";

export function getDownloaderPeerUrl(value: UploadedFile) {
  const url = new URL(window.location.href);
  url.searchParams.set("valueId", value.id);
  return url.toString();
}
