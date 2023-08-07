import { newRandomKeySecret, seal } from "./crypto";
import {
    RawCoValueID,
    CoValue,
    AgentCredential,
    AgentID,
    SessionID,
    Agent,
    getAgent,
    getAgentID,
    getAgentCoValueHeader,
    CoValueHeader,
    agentIDfromSessionID,
} from "./coValue";
import { Team, expectTeamContent } from "./permissions";
import { SyncManager } from "./sync";

export class LocalNode {
    coValues: { [key: RawCoValueID]: CoValueState } = {};
    agentCredential: AgentCredential;
    agentID: AgentID;
    ownSessionID: SessionID;
    knownAgents: { [key: AgentID]: Agent } = {};
    sync = new SyncManager(this);

    constructor(agentCredential: AgentCredential, ownSessionID: SessionID) {
        this.agentCredential = agentCredential;
        const agent = getAgent(agentCredential);
        const agentID = getAgentID(agent);
        this.agentID = agentID;
        this.knownAgents[agentID] = agent;
        this.ownSessionID = ownSessionID;

        const agentCoValue = new CoValue(getAgentCoValueHeader(agent), this);
        this.coValues[agentCoValue.id] = {
            state: "loaded",
            coValue: agentCoValue,
        };
    }

    createCoValue(header: CoValueHeader): CoValue {
        const coValue = new CoValue(header, this);
        this.coValues[coValue.id] = { state: "loaded", coValue: coValue };

        void this.sync.syncCoValue(coValue);

        return coValue;
    }

    loadCoValue(id: RawCoValueID): Promise<CoValue> {
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

    expectCoValueLoaded(id: RawCoValueID, expectation?: string): CoValue {
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

    addKnownAgent(agent: Agent) {
        const agentID = getAgentID(agent);
        this.knownAgents[agentID] = agent;
    }

    createTeam(): Team {
        const teamCoValue = this.createCoValue({
            type: "comap",
            ruleset: { type: "team", initialAdmin: this.agentID },
            meta: null,
        });

        let teamContent = expectTeamContent(teamCoValue.getCurrentContent());

        teamContent = teamContent.edit((editable) => {
            editable.set(this.agentID, "admin", "trusting");

            const readKey = newRandomKeySecret();
            const revelation = seal(
                readKey.secret,
                this.agentCredential.recipientSecret,
                new Set([getAgent(this.agentCredential).recipientID]),
                {
                    in: teamCoValue.id,
                    tx: teamCoValue.nextTransactionID(),
                }
            );

            editable.set(
                "readKey",
                { keyID: readKey.id, revelation },
                "trusting"
            );
        });

        return new Team(teamContent, this);
    }

    testWithDifferentCredentials(
        agentCredential: AgentCredential,
        ownSessionID: SessionID
    ): LocalNode {
        const newNode = new LocalNode(agentCredential, ownSessionID);

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

        newNode.knownAgents = {
            ...this.knownAgents,
            [agentIDfromSessionID(ownSessionID)]: getAgent(agentCredential),
        };

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
