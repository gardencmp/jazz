import {
    websocketReadableStream,
    websocketWritableStream,
} from "cojson-transport-nodejs-ws";
import { WebSocket } from "ws";
import "dotenv/config";

import { webcrypto } from "node:crypto";
import {
    AccountID,
    AccountMigration,
    AgentSecret,
    CoMap,
    ControlledAccount,
    LocalNode,
    Peer,
    Profile,
    SessionID,
    cojsonReady,
    cojsonInternals
} from "cojson";
import { readFile, writeFile } from "node:fs/promises";

if (!("crypto" in globalThis)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).crypto = webcrypto;
}

interface WorkerCredentialStorage {
    load(
        workerName: string
    ): Promise<
        { accountID: AccountID; accountSecret: AgentSecret } | undefined
    >;
    save(
        workerName: string,
        accountID: AccountID,
        accountSecret: AgentSecret
    ): Promise<void>;
}

export async function createOrResumeWorker<
    P extends Profile = Profile,
    R extends CoMap = CoMap
>({
    workerName,
    credentialStorage = FileCredentialStorage,
    syncServer = "wss://sync.jazz.tools",
    migration,
}: {
    workerName: string;
    credentialStorage?: WorkerCredentialStorage;
    syncServer?: string;
    migration?: AccountMigration<P, R>;
}) {
    await cojsonReady;

    const existingCredentials = await credentialStorage.load(workerName);

    let localNode: LocalNode;

    const ws = new WebSocket(syncServer);

    const wsPeer: Peer = {
        id: "globalMesh",
        role: "server",
        incoming: websocketReadableStream(ws),
        outgoing: websocketWritableStream(ws),
    };

    if (existingCredentials) {
        // TODO: locked sessions similar to browser
        const sessionID =
            process.env.JAZZ_WORKER_SESSION ||
            cojsonInternals.newRandomSessionID(existingCredentials.accountID);

        console.log("Loading worker", existingCredentials.accountID);

        localNode = await LocalNode.withLoadedAccount({
            accountID: existingCredentials.accountID,
            accountSecret: existingCredentials.accountSecret,
            sessionID: sessionID as SessionID,
            migration,
            peersToLoadFrom: [wsPeer],
        });

        console.log(
            "Resuming worker",
            existingCredentials.accountID,
            localNode
                .expectProfileLoaded(localNode.account.id as AccountID)
                .get("name")
        );
    } else {
        const newWorker = await LocalNode.withNewlyCreatedAccount({
            name: workerName,
            peersToLoadFrom: [wsPeer],
            migration,
        });

        localNode = newWorker.node;

        await credentialStorage.save(
            workerName,
            newWorker.accountID,
            newWorker.accountSecret
        );

        console.log("Created worker", newWorker.accountID, workerName);
    }

    return { localNode, worker: localNode.account as ControlledAccount<P, R> };
}

export { autoSub } from "jazz-autosub";

export const FileCredentialStorage: WorkerCredentialStorage = {
    async load(workerName: string): Promise<
        | {
              accountID: AccountID;
              accountSecret: `sealerSecret_z${string}/signerSecret_z${string}`;
          }
        | undefined
    > {
        try {
            const credentials = await readFile(
                `${workerName}Credentials.json`,
                "utf-8"
            );
            return JSON.parse(credentials);
        } catch (e) {
            return undefined;
        }
    },

    async save(
        workerName: string,
        accountID: AccountID,
        accountSecret: `sealerSecret_z${string}/signerSecret_z${string}`
    ): Promise<void> {
        await writeFile(
            `${workerName}Credentials.json`,
            JSON.stringify({ accountID, accountSecret }, undefined, 2)
        );
        console.log(
            `Saved credentials for ${workerName} to ${workerName}Credentials.json`
        );
        try {
            const gitginore = await readFile(".gitignore", "utf-8");
            if (!gitginore.includes(`${workerName}Credentials.json`)) {
                await writeFile(
                    ".gitignore",
                    gitginore + `\n${workerName}Credentials.json`
                );
                console.log(`Added ${workerName}Credentials.json to .gitignore`);
            }
        } catch (e) {
            console.warn(`Couldn't add ${workerName}Credentials.json to .gitignore, please add it yourself.`)
        }
    },
};
