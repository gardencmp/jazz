import { UploadedFile } from "../schema";

export function getDownloaderPeerUrl(value: UploadedFile) {
  const url = new URL(window.location.href);
  url.searchParams.set("valueId", value.id);
  return url.toString();
}
