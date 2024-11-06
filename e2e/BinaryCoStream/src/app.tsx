import React from "react";
import ReactDOM from "react-dom/client";
import { DownloaderPeer } from "./DownloaderPeer";
import { UploaderPeer } from "./UploaderPeer";
import { AuthAndJazz } from "./jazz";
import { getValueId } from "./lib/searchParams";

function Main() {
  const valueId = getValueId();

  if (valueId) {
    return <DownloaderPeer testCoMapId={valueId} />;
  }

  return <UploaderPeer />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthAndJazz>
      <Main />
    </AuthAndJazz>
  </React.StrictMode>,
);
