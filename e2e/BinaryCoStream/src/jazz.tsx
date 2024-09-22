import { createJazzReactContext, DemoAuth } from "jazz-react";
import { useEffect } from "react";
import { getValueId } from "./lib/searchParams";

function AutoLoginComponent(props: {
  appName: string;
  loading: boolean;
  existingUsers: string[];
  logInAs: (existingUser: string) => void;
  signUp: (username: string) => void;
}) {
  useEffect(() => {
    if (props.loading) return;

    props.signUp("Test User");
  }, [props.loading]);

  return <div>Signing up...</div>;
}

const key = getValueId()
  ? `downloader-e2e@jazz.tools`
  : `uploader-e2e@jazz.tools`;

const localSync = new URLSearchParams(location.search).has("localSync");

const Jazz = createJazzReactContext({
  auth: DemoAuth({
    appName: "BinaryCoStream Sync",
    Component: AutoLoginComponent,
  }),
  peer: localSync
    ? `ws://localhost:4200?key=${key}`
    : `wss://mesh.jazz.tools/?key=${key}`,
});

export const { useAccount, useCoState } = Jazz;
export { Jazz };
