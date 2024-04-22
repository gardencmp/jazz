import {
    websocketReadableStream,
    websocketWritableStream,
} from "cojson-transport-nodejs-ws";
import { WebSocket } from "ws";
import "dotenv/config";

import { webcrypto } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import {
    AccountID,
    AgentSecret,
    Peer,
    SessionID,
    cojsonInternals,
    cojsonReady,
} from "cojson";
import { Account, CoValueClass, ID, Me } from "jazz-tools";

if (!("crypto" in globalThis)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).crypto = webcrypto;
}

interface WorkerCredentialStorage {
    load(
        workerName: string
    ): Promise<
        { accountID: ID<Account>; accountSecret: AgentSecret } | undefined
    >;
    save(
        workerName: string,
        accountID: ID<Account>,
        accountSecret: AgentSecret
    ): Promise<void>;
}

export async function createOrResumeWorker<A extends Account>({
    workerName,
    credentialStorage = FileCredentialStorage,
    syncServer = "wss://sync.jazz.tools",
    accountSchema = Account as unknown as CoValueClass<A> & typeof Account,
}: {
    workerName: string;
    credentialStorage?: WorkerCredentialStorage;
    syncServer?: string;
    accountSchema?: CoValueClass<A> & typeof Account;
}): Promise<{ worker: A & Me }> {
    await cojsonReady;

    const existingCredentials = await credentialStorage.load(workerName);

    let worker: Account & Me;

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
            cojsonInternals.newRandomSessionID(
                existingCredentials.accountID as unknown as AccountID
            );

        console.log("Loading worker", existingCredentials.accountID);

        worker = await accountSchema.become({
            accountID: existingCredentials.accountID,
            accountSecret: existingCredentials.accountSecret,
            sessionID: sessionID as SessionID,
            peersToLoadFrom: [wsPeer],
        });

        console.log(
            "Resuming worker",
            existingCredentials.accountID,
            worker._raw.core.node
                .expectProfileLoaded(worker.id as unknown as AccountID)
                .get("name")
        );
    } else {
        worker = await accountSchema.create({
            name: workerName,
            peersToLoadFrom: [wsPeer],
        });

        await credentialStorage.save(
            workerName,
            worker.id,
            worker._raw.agentSecret
        );

        console.log("Created worker", worker.id, workerName);
    }

    return { worker: worker as A & Me};
}

export const FileCredentialStorage: WorkerCredentialStorage = {
    async load(workerName: string): Promise<
        | {
              accountID: ID<Account>;
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
        accountID: ID<Account>,
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
                console.log(
                    `Added ${workerName}Credentials.json to .gitignore`
                );
            }
        } catch (e) {
            console.warn(
                `Couldn't add ${workerName}Credentials.json to .gitignore, please add it yourself.`
            );
        }
    },
};
