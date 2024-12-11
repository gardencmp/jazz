import { Account, FileStream, ID } from "jazz-tools";
import { useEffect, useState } from "react";
import { useAccount, useCoState } from "../../jazz";
import { UploadedFile } from "./schema";

export function DownloaderPeer(props: { testCoMapId: ID<UploadedFile> }) {
  const account = useAccount();
  const testCoMap = useCoState(UploadedFile, props.testCoMapId, {});
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    async function run(me: Account, uploadedFileId: ID<UploadedFile>) {
      const uploadedFile = await UploadedFile.load(uploadedFileId, me, {});

      if (!uploadedFile) {
        throw new Error("Uploaded file not found");
      }

      me.waitForAllCoValuesSync().then(() => {
        setSynced(true);
      });

      uploadedFile.coMapDownloaded = true;

      await FileStream.loadAsBlob(uploadedFile._refs.file.id, me);

      uploadedFile.syncCompleted = true;
    }

    run(account.me, props.testCoMapId);
  }, []);

  return (
    <>
      <h1>Downloader Peer</h1>
      <div>Fetching: {props.testCoMapId}</div>
      <div>Synced: {String(synced)}</div>
      <div data-testid="result">
        Covalue: {Boolean(testCoMap?.id) ? "Downloaded" : "Not Downloaded"}
      </div>
      <div data-testid="result">
        File:{" "}
        {Boolean(testCoMap?.syncCompleted) ? "Downloaded" : "Not Downloaded"}
      </div>
    </>
  );
}
