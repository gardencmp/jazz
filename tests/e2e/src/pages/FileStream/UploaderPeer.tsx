import { ID } from "jazz-tools";
import { useEffect, useState } from "react";
import { useAccount, useCoState } from "../../jazz";
import { createCredentiallessIframe } from "../../lib/createCredentiallessIframe";
import { waitForCoValue } from "../../lib/waitForCoValue";
import { BytesRadioGroup } from "./lib/BytesRadioGroup";
import { generateTestFile } from "./lib/generateTestFile";
import { getDownloaderPeerUrl } from "./lib/getDownloaderPeerUrl";
import { getDefaultFileSize, getIsAutoUpload } from "./lib/searchParams";
import { UploadedFile } from "./schema";

export function UploaderPeer() {
  const account = useAccount();
  const [uploadedFileId, setUploadedFileId] = useState<
    ID<UploadedFile> | undefined
  >(undefined);
  const [syncDuration, setSyncDuration] = useState<number | null>(null);
  const [bytes, setBytes] = useState(getDefaultFileSize);
  const [synced, setSynced] = useState(false);

  const testFile = useCoState(UploadedFile, uploadedFileId, {});

  async function uploadTestFile() {
    if (!account) return;

    setUploadedFileId(undefined);
    setSynced(false);

    // Mark the sync start
    performance.mark("sync-start");

    const file = await generateTestFile(account.me, bytes);

    // Create a credential-less iframe to spawn the downloader peer
    const iframe = createCredentiallessIframe(getDownloaderPeerUrl(file));
    document.body.appendChild(iframe);

    setSyncDuration(null);
    setUploadedFileId(file.id);

    account.me.waitForAllCoValuesSync().then(() => {
      setSynced(true);
    });

    // The downloader peer will set the syncCompleted to true when the download is complete.
    // We use this to measure the sync duration.
    await waitForCoValue(
      UploadedFile,
      file.id,
      account.me,
      (value) => value.syncCompleted,
      {},
    );

    iframe.remove();

    // Calculate the sync duration
    performance.mark("sync-end");
    const measure = performance.measure("sync", "sync-start", "sync-end");
    setSyncDuration(measure.duration);
  }

  useEffect(() => {
    if (getIsAutoUpload()) {
      uploadTestFile();
    }
  }, []);

  return (
    <>
      <BytesRadioGroup selectedValue={bytes} onChange={setBytes} />

      <button onClick={uploadTestFile}>Upload Test File</button>
      {uploadedFileId && (
        <>
          <div>{uploadedFileId}</div>
          <div data-testid="synced-with-server">
            Synced with the server: {String(synced)}
          </div>
        </>
      )}

      {syncDuration && (
        <div data-testid="sync-duration">
          Two way sync duration: {syncDuration.toFixed(2)}ms
        </div>
      )}
      {uploadedFileId && (
        <div data-testid="result">
          Two way sync completed: {String(Boolean(syncDuration))}
        </div>
      )}
      {testFile?.coMapDownloaded && (
        <div data-testid="co-map-downloaded">CoMap synced!</div>
      )}
    </>
  );
}
