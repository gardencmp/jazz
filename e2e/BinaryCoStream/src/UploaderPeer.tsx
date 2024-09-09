import { ID } from "jazz-tools";
import { useEffect, useState } from "react";
import { useAccount } from "./jazz";
import { createCredentiallessIframe } from "./lib/createCredentiallessIframe";
import { generateTestFile } from "./lib/generateTestFile";
import { getDownloaderPeerUrl } from "./lib/getDownloaderPeerUrl";
import { UploadedFile } from "./schema";
import { waitForCoValue } from "./lib/waitForCoValue";
import { getDefaultFileSize, getIsAutoUpload } from "./lib/searchParams";

export function UploaderPeer() {
  const account = useAccount();
  const [uploadedFileId, setUploadedFileId] = useState<
    ID<UploadedFile> | undefined
  >(undefined);
  const [syncDuration, setSyncDuration] = useState<number | null>(null);
  const [bytes, setBytes] = useState(getDefaultFileSize);

  async function uploadTestFile() {
    if (!account) return;

    // Mark the sync start
    performance.mark("sync-start");

    const file = await generateTestFile(account.me, bytes);

    // Create a credential-less iframe to spawn the downloader peer
    const iframe = createCredentiallessIframe(getDownloaderPeerUrl(file));
    document.body.appendChild(iframe);

    setUploadedFileId(file.id);

    // The downloader peer will set the syncCompleted to true when the download is complete.
    // We use this to measure the sync duration.
    await waitForCoValue(
      UploadedFile,
      file.id,
      account.me,
      (value) => value.syncCompleted,
      {}
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
      <p>
        <BytesRadioInput
          label="100KB"
          value={1e5}
          selectedValue={bytes}
          onChange={setBytes}
        />
        <BytesRadioInput
          label="1MB"
          value={1e6}
          selectedValue={bytes}
          onChange={setBytes}
        />
        <BytesRadioInput
          label="10MB"
          value={1e7}
          selectedValue={bytes}
          onChange={setBytes}
        />
      </p>

      <button onClick={uploadTestFile}>Upload Test File</button>
      {uploadedFileId && <div>{uploadedFileId}</div>}
      {syncDuration && (
        <div data-testid="sync-duration">
          Sync Duration: {syncDuration.toFixed(2)}ms
        </div>
      )}
      {uploadedFileId && (
        <div data-testid="result">
          Sync Completed: {String(Boolean(syncDuration))}
        </div>
      )}
    </>
  );
}

function BytesRadioInput(props: {
  label: string;
  value: number;
  selectedValue: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      <input
        type="radio"
        name="bytes"
        value={props.value}
        checked={props.value === props.selectedValue}
        onChange={() => props.onChange(props.value)}
      />
      {props.label}
    </label>
  );
}
