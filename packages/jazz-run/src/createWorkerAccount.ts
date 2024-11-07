import { createWebSocketPeer } from "cojson-transport-ws";
import { WebSocket } from "ws";
import {
    Account,
    Peer,
    WasmCrypto,
    createJazzContext,
    isControlledAccount,
} from "jazz-tools";
import { fixedCredentialsAuth, randomSessionProvider } from "jazz-tools";
import { CoValueCore } from "cojson";

export const createWorkerAccount = async ({
    name,
    peer: peerAddr,
}: {
    name: string;
    peer: string;
}) => {
    const crypto = await WasmCrypto.create();

    const peer = createWebSocketPeer({
        id: "upstream",
        websocket: new WebSocket(peerAddr),
        role: "server",
    });

    const account = await Account.create({
        creationProps: { name },
        peersToLoadFrom: [peer],
        crypto,
    });

    if (!isControlledAccount(account)) {
        throw new Error("account is not a controlled account");
    }

    const accountCoValue = account._raw.core;
    const accountProfileCoValue = account.profile!._raw.core;
    const syncManager = account._raw.core.node.syncManager;

    await Promise.all([
        syncManager.syncCoValue(accountCoValue),
        syncManager.syncCoValue(accountProfileCoValue),
    ]);

    await Promise.all([
        waitForSync(account, peer, accountCoValue),
        waitForSync(account, peer, accountProfileCoValue),
    ]);

    // Spawn a second peer to double check that the account is fully synced
    const peer2 = createWebSocketPeer({
        id: "upstream2",
        websocket: new WebSocket(peerAddr),
        role: "server",
    });

    await createJazzContext({
        auth: fixedCredentialsAuth({
            accountID: account.id,
            secret: account._raw.agentSecret,
        }),
        sessionProvider: randomSessionProvider,
        peersToLoadFrom: [peer2],
        crypto,
    });

    return {
        accountId: account.id,
        agentSecret: account._raw.agentSecret,
    };
};

function waitForSync(account: Account, peer: Peer, coValue: CoValueCore) {
    const syncManager = account._raw.core.node.syncManager;

    return Promise.race([
        failAfter(10_000, "Timeout: can't upload the account data to the target peer."),
        syncManager.waitForUploadIntoPeer(peer.id, coValue.id)
    ])
}

function failAfter(timeout: number, message: string) {
    return new Promise((_, reject) => {
        setTimeout(() => reject(new Error(message)), timeout);
    });
}
