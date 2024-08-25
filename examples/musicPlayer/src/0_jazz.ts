import { MusicaAccount } from "@/1_schema";
import { createJazzReactContext, DemoAuth } from "jazz-react";

export const Jazz = createJazzReactContext({
    auth: DemoAuth({ appName: "Musica Jazz", accountSchema: MusicaAccount }),
    peer: `wss://mesh.jazz.tools/?key=example@email.com`,
});

export const { useAccount, useCoState, useAcceptInvite } = Jazz;