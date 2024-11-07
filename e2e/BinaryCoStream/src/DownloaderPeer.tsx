import { Account, BinaryCoStream, ID } from "jazz-tools";
import { useEffect } from "react";
import { useAccount, useCoState } from "./jazz";
import { waitForCoValue } from "./lib/waitForCoValue";
import { UploadedFile } from "./schema";

async function getUploadedFile(me: Account, uploadedFileId: ID<UploadedFile>) {
  const uploadedFile = await waitForCoValue(
    UploadedFile,
    uploadedFileId,
    me,
    Boolean,
    {},
  );

  uploadedFile.coMapDownloaded = true;

  await BinaryCoStream.loadAsBlob(uploadedFile._refs.file.id, me);

  return uploadedFile;
}

export function DownloaderPeer(props: { testCoMapId: ID<UploadedFile> }) {
  const account = useAccount();
  const testCoMap = useCoState(UploadedFile, props.testCoMapId, {});

  useEffect(() => {
    getUploadedFile(account.me, props.testCoMapId).then((value) => {
      value.syncCompleted = true;
    });
  }, []);

  return (
    <>
      <h1>Downloader Peer</h1>
      <div>Fetching: {props.testCoMapId}</div>
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
