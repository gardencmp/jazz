import React from "react";
import ReactDOM from "react-dom/client";
import { DownloaderPeer } from "./DownloaderPeer";
import { Jazz } from "./jazz";
import { UploaderPeer } from "./UploaderPeer";
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
      <Jazz.Provider>
          <Main />
      </Jazz.Provider>
  </React.StrictMode>,
);
