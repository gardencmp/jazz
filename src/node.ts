import {
    createdNowUnique,
    getAgentID,
    getAgentSealerID,
    getAgentSealerSecret,
    newRandomAgentSecret,
    newRandomKeySecret,
    seal,
} from "./crypto.js";
import { CoValue, CoValueHeader, newRandomSessionID } from "./coValue.js";
import { Team, TeamContent, expectTeamContent } from "./permissions.js";
import { SyncManager } from "./sync.js";
import { AgentID, RawCoID, SessionID, isAgentID } from "./ids.js";
import { CoID, ContentType } from "./contentType.js";
import {
    Account,
    AccountMeta,
    AccountIDOrAgentID,
    accountHeaderForInitialAgentSecret,
    GeneralizedControlledAccount,
    ControlledAccount,
    AnonymousControlledAccount,
} from "./account.js";
import { CoMap } from "./index.js";

export class LocalNode {
    coValues: { [key: RawCoID]: CoValueState } = {};
    account: GeneralizedControlledAccount;
    ownSessionID: SessionID;
    sync = new SyncManager(this);

    constructor(
        account: GeneralizedControlledAccount,
        ownSessionID: SessionID
    ) {
        this.account = account;
        this.ownSessionID = ownSessionID;
    }

    createCoValue(header: CoValueHeader): CoValue {
        const coValue = new CoValue(header, this);
        this.coValues[coValue.id] = { state: "loaded", coValue: coValue };

        void this.sync.syncCoValue(coValue);

        return coValue;
    }

    loadCoValue(id: RawCoID): Promise<CoValue> {
        let entry = this.coValues[id];
        if (!entry) {
            entry = newLoadingState();

            this.coValues[id] = entry;

            this.sync.loadFromPeers(id);
        }
        if (entry.state === "loaded") {
            return Promise.resolve(entry.coValue);
        }
        return entry.done;
    }

    async load<T extends ContentType>(id: CoID<T>): Promise<T> {
        return (await this.loadCoValue(id)).getCurrentContent() as T;
    }

    expectCoValueLoaded(id: RawCoID, expectation?: string): CoValue {
        const entry = this.coValues[id];
        if (!entry) {
            throw new Error(
                `${expectation ? expectation + ": " : ""}Unknown CoValue ${id}`
            );
        }
        if (entry.state === "loading") {
            throw new Error(
                `${
                    expectation ? expectation + ": " : ""
                }CoValue ${id} not yet loaded`
            );
        }
        return entry.coValue;
    }

    createAccount(_publicNickname: string): ControlledAccount {
        const agentSecret = newRandomAgentSecret();

        const account = this.createCoValue(
            accountHeaderForInitialAgentSecret(agentSecret)
        ).testWithDifferentAccount(
            new AnonymousControlledAccount(agentSecret),
            newRandomSessionID(getAgentID(agentSecret))
        );

        expectTeamContent(account.getCurrentContent()).edit((editable) => {
            editable.set(getAgentID(agentSecret), "admin", "trusting");

            const readKey = newRandomKeySecret();

            editable.set(
                `${readKey.id}_for_${getAgentID(agentSecret)}`,
                seal(
                    readKey.secret,
                    getAgentSealerSecret(agentSecret),
                    getAgentSealerID(getAgentID(agentSecret)),
                    {
                        in: account.id,
                        tx: account.nextTransactionID(),
                    }
                ),
                "trusting"
            );

            editable.set('readKey', readKey.id, "trusting");
        });

        return new ControlledAccount(
            agentSecret,
            account.getCurrentContent() as CoMap<TeamContent, AccountMeta>,
            this
        );
    }

    resolveAccountAgent(id: AccountIDOrAgentID, expectation?: string): AgentID {
        if (isAgentID(id)) {
            return id;
        }

        const coValue = this.expectCoValueLoaded(id, expectation);

        if (
            coValue.header.type !== "comap" ||
            coValue.header.ruleset.type !== "team" ||
            !coValue.header.meta ||
            !("type" in coValue.header.meta) ||
            coValue.header.meta.type !== "account"
        ) {
            throw new Error(
                `${
                    expectation ? expectation + ": " : ""
                }CoValue ${id} is not an account`
            );
        }

        return new Account(
            coValue.getCurrentContent() as CoMap<TeamContent, AccountMeta>,
            this
        ).getCurrentAgentID();
    }

    createTeam(): Team {
        const teamCoValue = this.createCoValue({
            type: "comap",
            ruleset: { type: "team", initialAdmin: this.account.id },
            meta: null,
            ...createdNowUnique(),
        });

        let teamContent = expectTeamContent(teamCoValue.getCurrentContent());

        teamContent = teamContent.edit((editable) => {
            editable.set(this.account.id, "admin", "trusting");

            const readKey = newRandomKeySecret();

            editable.set(
                `${readKey.id}_for_${this.account.id}`,
                seal(
                    readKey.secret,
                    this.account.currentSealerSecret(),
                    this.account.currentSealerID(),
                    {
                        in: teamCoValue.id,
                        tx: teamCoValue.nextTransactionID(),
                    }
                ),
                "trusting"
            );

            editable.set('readKey', readKey.id, "trusting");
        });

        return new Team(teamContent, this);
    }

    testWithDifferentAccount(
        account: GeneralizedControlledAccount,
        ownSessionID: SessionID
    ): LocalNode {
        const newNode = new LocalNode(account, ownSessionID);

        newNode.coValues = Object.fromEntries(
            Object.entries(this.coValues)
                .map(([id, entry]) => {
                    if (entry.state === "loading") {
                        return undefined;
                    }

                    const newCoValue = new CoValue(
                        entry.coValue.header,
                        newNode
                    );

                    newCoValue.sessions = entry.coValue.sessions;

                    return [id, { state: "loaded", coValue: newCoValue }];
                })
                .filter((x): x is Exclude<typeof x, undefined> => !!x)
        );

        return newNode;
    }
}

type CoValueState =
    | {
          state: "loading";
          done: Promise<CoValue>;
          resolve: (coValue: CoValue) => void;
      }
    | { state: "loaded"; coValue: CoValue };

export function newLoadingState(): CoValueState {
    let resolve: (coValue: CoValue) => void;

    const promise = new Promise<CoValue>((r) => {
        resolve = r;
    });

    return {
        state: "loading",
        done: promise,
        resolve: resolve!,
    };
}
