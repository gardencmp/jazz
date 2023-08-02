import { CoMap } from "./contentType";
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
    agentIDAsCoValueID,
} from "./coValue";
import { Team, expectTeamContent } from "./permissions";
import {
    NewContentMessage,
    Peer,
    PeerID,
    PeerState,
    SessionNewContent,
    SubscribeMessage,
    SubscribeResponseMessage,
    SyncMessage,
    UnsubscribeMessage,
    WrongAssumedKnownStateMessage,
    combinedKnownStates,
    weAreStrictlyAhead,
} from "./sync";

export class LocalNode {
    coValues: { [key: RawCoValueID]: CoValueState } = {};
    peers: { [key: PeerID]: PeerState } = {};
    agentCredential: AgentCredential;
    agentID: AgentID;
    ownSessionID: SessionID;
    knownAgents: { [key: AgentID]: Agent } = {};

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

        this.syncCoValue(coValue);

        return coValue;
    }

    loadCoValue(id: RawCoValueID): Promise<CoValue> {
        let entry = this.coValues[id];
        if (!entry) {
            entry = newLoadingState();

            this.coValues[id] = entry;

            for (const peer of Object.values(this.peers)) {
                peer.outgoing
                    .write({
                        action: "subscribe",
                        knownState: {
                            coValueID: id,
                            header: false,
                            sessions: {},
                        },
                    })
                    .catch((e) => {
                        console.error("Error writing to peer", e);
                    });
            }
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

    addPeer(peer: Peer) {
        const peerState: PeerState = {
            id: peer.id,
            optimisticKnownStates: {},
            incoming: peer.incoming,
            outgoing: peer.outgoing.getWriter(),
            role: peer.role,
        };
        this.peers[peer.id] = peerState;

        if (peer.role === "server") {
            for (const entry of Object.values(this.coValues)) {
                if (entry.state === "loading") {
                    continue;
                }

                peerState.outgoing
                    .write({
                        action: "subscribe",
                        knownState: entry.coValue.knownState(),
                    })
                    .catch((e) => {
                        // TODO: handle error
                        console.error("Error writing to peer", e);
                    });

                peerState.optimisticKnownStates[entry.coValue.id] = {
                    coValueID: entry.coValue.id,
                    header: false,
                    sessions: {},
                };
            }
        }

        const readIncoming = async () => {
            for await (const msg of peerState.incoming) {
                for (const responseMsg of this.handleSyncMessage(
                    msg,
                    peerState
                )) {
                    await peerState.outgoing.write(responseMsg);
                }
            }
        };

        readIncoming().catch((e) => {
            // TODO: handle error
            console.error("Error reading from peer", e);
        });
    }

    handleSyncMessage(msg: SyncMessage, peer: PeerState): SyncMessage[] {
        // TODO: validate
        switch (msg.action) {
            case "subscribe":
                return this.handleSubscribe(msg, peer);
            case "subscribeResponse":
                return this.handleSubscribeResponse(msg, peer);
            case "newContent":
                return this.handleNewContent(msg);
            case "wrongAssumedKnownState":
                return this.handleWrongAssumedKnownState(msg, peer);
            case "unsubscribe":
                return this.handleUnsubscribe(msg);
            default:
                throw new Error(`Unknown message type ${(msg as any).action}`);
        }
    }

    handleSubscribe(
        msg: SubscribeMessage,
        peer: PeerState,
        asDependencyOf?: RawCoValueID
    ): SyncMessage[] {
        const entry = this.coValues[msg.knownState.coValueID];

        if (!entry || entry.state === "loading") {
            if (!entry) {
                this.coValues[msg.knownState.coValueID] = newLoadingState();
            }

            return [
                {
                    action: "subscribeResponse",
                    knownState: {
                        coValueID: msg.knownState.coValueID,
                        header: false,
                        sessions: {},
                    },
                },
            ];
        }

        peer.optimisticKnownStates[entry.coValue.id] =
            entry.coValue.knownState();

        const newContent = entry.coValue.newContentSince(msg.knownState);

        const dependedOnCoValues =
            entry.coValue.header.ruleset.type === "team"
                ? expectTeamContent(entry.coValue.getCurrentContent())
                      .keys()
                      .filter((k): k is AgentID => k.startsWith("agent_"))
                      .map((agent) => agentIDAsCoValueID(agent))
                : entry.coValue.header.ruleset.type === "ownedByTeam"
                ? [entry.coValue.header.ruleset.team]
                : [];

        return [
            ...dependedOnCoValues.flatMap((coValueID) =>
                this.handleSubscribe(
                    {
                        action: "subscribe",
                        knownState: {
                            coValueID,
                            header: false,
                            sessions: {},
                        },
                    },
                    peer,
                    asDependencyOf || msg.knownState.coValueID
                )
            ),
            {
                action: "subscribeResponse",
                knownState: entry.coValue.knownState(),
                asDependencyOf,
            },
            ...(newContent ? [newContent] : []),
        ];
    }

    handleSubscribeResponse(
        msg: SubscribeResponseMessage,
        peer: PeerState
    ): SyncMessage[] {
        let entry = this.coValues[msg.knownState.coValueID];

        if (!entry) {
            if (msg.asDependencyOf) {
                if (this.coValues[msg.asDependencyOf]) {
                    entry = newLoadingState();

                    this.coValues[msg.knownState.coValueID] = entry;
                }
            } else {
                throw new Error(
                    "Expected coValue entry to be created, missing subscribe?"
                );
            }
        }

        if (entry.state === "loading") {
            peer.optimisticKnownStates[msg.knownState.coValueID] =
                msg.knownState;
            return [];
        }

        const newContent = entry.coValue.newContentSince(msg.knownState);
        peer.optimisticKnownStates[msg.knownState.coValueID] =
            combinedKnownStates(msg.knownState, entry.coValue.knownState());

        return newContent ? [newContent] : [];
    }

    handleNewContent(msg: NewContentMessage): SyncMessage[] {
        let entry = this.coValues[msg.coValueID];

        if (!entry) {
            throw new Error(
                "Expected coValue entry to be created, missing subscribe?"
            );
        }

        let resolveAfterDone: ((coValue: CoValue) => void) | undefined;

        if (entry.state === "loading") {
            if (!msg.header) {
                throw new Error("Expected header to be sent in first message");
            }

            const coValue = new CoValue(msg.header, this);

            resolveAfterDone = entry.resolve;

            entry = {
                state: "loaded",
                coValue: coValue,
            };

            this.coValues[msg.coValueID] = entry;
        }

        const coValue = entry.coValue;

        let invalidStateAssumed = false;

        for (const sessionID of Object.keys(msg.newContent) as SessionID[]) {
            const ourKnownTxIdx =
                coValue.sessions[sessionID]?.transactions.length;
            const theirFirstNewTxIdx = msg.newContent[sessionID].after;

            if ((ourKnownTxIdx || 0) < theirFirstNewTxIdx) {
                invalidStateAssumed = true;
                continue;
            }

            const alreadyKnownOffset = ourKnownTxIdx
                ? ourKnownTxIdx - theirFirstNewTxIdx
                : 0;

            const newTransactions =
                msg.newContent[sessionID].newTransactions.slice(
                    alreadyKnownOffset
                );

            const success = coValue.tryAddTransactions(
                sessionID,
                newTransactions,
                msg.newContent[sessionID].lastHash,
                msg.newContent[sessionID].lastSignature
            );

            if (!success) {
                console.error("Failed to add transactions", newTransactions);
                continue;
            }
        }

        if (resolveAfterDone) {
            resolveAfterDone(coValue);
        }

        return invalidStateAssumed
            ? [
                  {
                      action: "wrongAssumedKnownState",
                      knownState: coValue.knownState(),
                  },
              ]
            : [];
    }

    handleWrongAssumedKnownState(
        msg: WrongAssumedKnownStateMessage,
        peer: PeerState
    ): SyncMessage[] {
        const coValue = this.expectCoValueLoaded(msg.knownState.coValueID);

        peer.optimisticKnownStates[msg.knownState.coValueID] =
            combinedKnownStates(msg.knownState, coValue.knownState());

        const newContent = coValue.newContentSince(msg.knownState);

        return newContent ? [newContent] : [];
    }

    handleUnsubscribe(msg: UnsubscribeMessage): SyncMessage[] {
        throw new Error("Method not implemented.");
    }

    async syncCoValue(coValue: CoValue) {
        for (const peer of Object.values(this.peers)) {
            const optimisticKnownState =
                peer.optimisticKnownStates[coValue.id];

            if (optimisticKnownState || peer.role === "server") {
                const newContent =
                    coValue.newContentSince(optimisticKnownState);

                peer.optimisticKnownStates[coValue.id] = peer
                    .optimisticKnownStates[coValue.id]
                    ? combinedKnownStates(
                          peer.optimisticKnownStates[coValue.id],
                          coValue.knownState()
                      )
                    : coValue.knownState();

                if (!optimisticKnownState && peer.role === "server") {
                    // auto-subscribe
                    await peer.outgoing.write({
                        action: "subscribe",
                        knownState: coValue.knownState(),
                    });
                }

                if (newContent) {
                    await peer.outgoing.write(newContent);
                }
            }
        }
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

function newLoadingState(): CoValueState {
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
