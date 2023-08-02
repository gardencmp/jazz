import { CoMap } from "./coValue";
import { newRandomKeySecret, seal } from "./crypto";
import {
    MultiLogID,
    MultiLog,
    AgentCredential,
    AgentID,
    SessionID,
    Agent,
    getAgent,
    getAgentID,
    getAgentMultilogHeader,
    MultiLogHeader,
    agentIDfromSessionID,
} from "./multilog";
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
    multilogs: { [key: MultiLogID]: MultilogState } = {};
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

        const agentMultilog = new MultiLog(getAgentMultilogHeader(agent), this);
        this.multilogs[agentMultilog.id] = {
            state: "loaded",
            multilog: agentMultilog,
        };
    }

    createMultiLog(header: MultiLogHeader): MultiLog {
        const multilog = new MultiLog(header, this);
        this.multilogs[multilog.id] = { state: "loaded", multilog };

        this.syncMultiLog(multilog);

        return multilog;
    }

    expectMultiLogLoaded(id: MultiLogID, expectation?: string): MultiLog {
        const entry = this.multilogs[id];
        if (!entry) {
            throw new Error(`Unknown multilog ${id}`);
        }
        if (entry.state === "loading") {
            throw new Error(
                `${
                    expectation ? expectation + ": " : ""
                }Multilog ${id} not yet loaded`
            );
        }
        return entry.multilog;
    }

    addKnownAgent(agent: Agent) {
        const agentID = getAgentID(agent);
        this.knownAgents[agentID] = agent;
    }

    createTeam(): Team {
        const teamMultilog = this.createMultiLog({
            type: "comap",
            ruleset: { type: "team", initialAdmin: this.agentID },
            meta: null,
        });

        let teamContent = expectTeamContent(teamMultilog.getCurrentContent());

        teamContent = teamContent.edit((editable) => {
            editable.set(this.agentID, "admin", "trusting");

            const readKey = newRandomKeySecret();
            const revelation = seal(
                readKey.secret,
                this.agentCredential.recipientSecret,
                new Set([getAgent(this.agentCredential).recipientID]),
                {
                    in: teamMultilog.id,
                    tx: teamMultilog.nextTransactionID(),
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
            for (const entry of Object.values(this.multilogs)) {
                if (entry.state === "loading") {
                    continue;
                }

                peerState.outgoing
                    .write({
                        action: "subscribe",
                        knownState: entry.multilog.knownState(),
                    })
                    .catch((e) => {
                        // TODO: handle error
                        console.error("Error writing to peer", e);
                    });

                peerState.optimisticKnownStates[entry.multilog.id] = {
                    multilogID: entry.multilog.id,
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

    handleSubscribe(msg: SubscribeMessage, peer: PeerState): SyncMessage[] {
        const entry = this.multilogs[msg.knownState.multilogID];

        if (!entry || entry.state === "loading") {
            if (!entry) {
                let resolve: (multilog: MultiLog) => void;

                const promise = new Promise<MultiLog>((r) => {
                    resolve = r;
                });

                this.multilogs[msg.knownState.multilogID] = {
                    state: "loading",
                    done: promise,
                    resolve: resolve!,
                };
            }

            return [
                {
                    action: "subscribeResponse",
                    knownState: {
                        multilogID: msg.knownState.multilogID,
                        header: false,
                        sessions: {},
                    },
                },
            ];
        }

        peer.optimisticKnownStates[entry.multilog.id] =
            entry.multilog.knownState();

        const newContent = entry.multilog.newContentSince(msg.knownState);

        return [
            {
                action: "subscribeResponse",
                knownState: entry.multilog.knownState(),
            },
            ...(newContent ? [newContent] : []),
        ];
    }

    handleSubscribeResponse(
        msg: SubscribeResponseMessage,
        peer: PeerState
    ): SyncMessage[] {
        const entry = this.multilogs[msg.knownState.multilogID];

        if (!entry || entry.state === "loading") {
            throw new Error(
                "Expected multilog entry to be created, missing subscribe?"
            );
        }

        const newContent = entry.multilog.newContentSince(msg.knownState);
        peer.optimisticKnownStates[msg.knownState.multilogID] =
            combinedKnownStates(msg.knownState, entry.multilog.knownState());

        return newContent ? [newContent] : [];
    }

    handleNewContent(msg: NewContentMessage): SyncMessage[] {
        let entry = this.multilogs[msg.multilogID];

        if (!entry) {
            throw new Error(
                "Expected multilog entry to be created, missing subscribe?"
            );
        }

        let resolveAfterDone: ((multilog: MultiLog) => void) | undefined;

        if (entry.state === "loading") {
            if (!msg.header) {
                throw new Error("Expected header to be sent in first message");
            }

            const multilog = new MultiLog(msg.header, this);

            resolveAfterDone = entry.resolve;

            entry = {
                state: "loaded",
                multilog,
            };

            this.multilogs[msg.multilogID] = entry;
        }

        const multilog = entry.multilog;

        let invalidStateAssumed = false;

        for (const sessionID of Object.keys(msg.newContent) as SessionID[]) {
            const ourKnownTxIdx =
                multilog.sessions[sessionID]?.transactions.length;
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

            const success = multilog.tryAddTransactions(
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
            resolveAfterDone(multilog);
        }

        return invalidStateAssumed
            ? [
                  {
                      action: "wrongAssumedKnownState",
                      knownState: multilog.knownState(),
                  },
              ]
            : [];
    }

    handleWrongAssumedKnownState(
        msg: WrongAssumedKnownStateMessage,
        peer: PeerState
    ): SyncMessage[] {
        const multilog = this.expectMultiLogLoaded(msg.knownState.multilogID);

        peer.optimisticKnownStates[msg.knownState.multilogID] =
            combinedKnownStates(msg.knownState, multilog.knownState());

        const newContent = multilog.newContentSince(msg.knownState);

        return newContent ? [newContent] : [];
    }

    handleUnsubscribe(msg: UnsubscribeMessage): SyncMessage[] {
        throw new Error("Method not implemented.");
    }

    async syncMultiLog(multilog: MultiLog) {
        for (const peer of Object.values(this.peers)) {
            const optimisticKnownState =
                peer.optimisticKnownStates[multilog.id];

            if (optimisticKnownState || peer.role === "server") {
                const newContent =
                    multilog.newContentSince(optimisticKnownState);

                peer.optimisticKnownStates[multilog.id] = peer
                    .optimisticKnownStates[multilog.id]
                    ? combinedKnownStates(
                          peer.optimisticKnownStates[multilog.id],
                          multilog.knownState()
                      )
                    : multilog.knownState();

                if (!optimisticKnownState && peer.role === "server") {
                    // auto-subscribe
                    await peer.outgoing.write({
                        action: "subscribe",
                        knownState: multilog.knownState(),
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

        newNode.multilogs = Object.fromEntries(
            Object.entries(this.multilogs)
                .map(([id, entry]) => {
                    if (entry.state === "loading") {
                        return undefined;
                    }

                    const newMultilog = new MultiLog(
                        entry.multilog.header,
                        newNode
                    );

                    newMultilog.sessions = entry.multilog.sessions;

                    return [id, { state: "loaded", multilog: newMultilog }];
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

type MultilogState =
    | {
          state: "loading";
          done: Promise<MultiLog>;
          resolve: (multilog: MultiLog) => void;
      }
    | { state: "loaded"; multilog: MultiLog };
