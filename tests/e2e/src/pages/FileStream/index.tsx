import { DownloaderPeer } from "./DownloaderPeer";
import { UploaderPeer } from "./UploaderPeer";
import { getValueId } from "./lib/searchParams";

export function FileStreamTest() {
  const valueId = getValueId();

  if (valueId) {
    return <DownloaderPeer testCoMapId={valueId} />;
  }

  return <UploaderPeer />;
}
