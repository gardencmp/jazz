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
    SyncMessage,
    UnsubscribeMessage,
    WrongAssumedKnownStateMessage,
} from "./sync";

export class LocalNode {
    multilogs: { [key: MultiLogID]: Promise<MultiLog> | MultiLog } = {};
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
        this.multilogs[agentMultilog.id] = Promise.resolve(agentMultilog);
    }

    createMultiLog(header: MultiLogHeader): MultiLog {
        const requiredMultiLogs =
            header.ruleset.type === "ownedByTeam"
                ? {
                      [header.ruleset.team]: this.expectMultiLogLoaded(
                          header.ruleset.team
                      ),
                  }
                : {};

        const multilog = new MultiLog(header, this);
        this.multilogs[multilog.id] = multilog;
        return multilog;
    }

    expectMultiLogLoaded(id: MultiLogID): MultiLog {
        const multilog = this.multilogs[id];
        if (!multilog) {
            throw new Error(`Unknown multilog ${id}`);
        }
        if (multilog instanceof Promise) {
            throw new Error(`Multilog ${id} not yet loaded`);
        }
        return multilog;
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

    async addPeer(peer: Peer) {
        const peerState = {
            id: peer.id,
            optimisticKnownStates: {},
            incoming: peer.incoming,
            outgoing: peer.outgoing.getWriter(),
        };
        this.peers[peer.id] = peerState;

        for await (const msg of peerState.incoming) {
            const response = this.handleSyncMessage(msg, peerState);

            if (response) {
                await peerState.outgoing.write(response);
            }
        }
    }

    handleSyncMessage(
        msg: SyncMessage,
        peer: PeerState
    ): SyncMessage | undefined {
        // TODO: validate
        switch (msg.type) {
            case "subscribe":
                return this.handleSubscribe(msg, peer);
            case "newContent":
                return this.handleNewContent(msg);
            case "wrongAssumedKnownState":
                return this.handleWrongAssumedKnownState(msg);
            case "unsubscribe":
                return this.handleUnsubscribe(msg);
        }
    }

    handleSubscribe(
        msg: SubscribeMessage,
        peer: PeerState
    ): SyncMessage | undefined {
        const multilog = this.expectMultiLogLoaded(msg.knownState.multilogID);

        peer.optimisticKnownStates[multilog.id] = multilog.knownState();

        return multilog.newContentSince(msg.knownState);
    }

    handleNewContent(msg: NewContentMessage): SyncMessage | undefined {
        return undefined;
    }

    handleWrongAssumedKnownState(
        msg: WrongAssumedKnownStateMessage
    ): SyncMessage | undefined {
        return undefined;
    }

    handleUnsubscribe(msg: UnsubscribeMessage): SyncMessage | undefined {
        return undefined;
    }

    async syncMultiLog(multilog: MultiLog) {
        for (const peer of Object.values(this.peers)) {
            const optimisticKnownState =
                peer.optimisticKnownStates[multilog.id];

            const newContent = multilog.newContentSince(optimisticKnownState);

            peer.optimisticKnownStates[multilog.id] = multilog.knownState();

            if (newContent) {
                await peer.outgoing.write(newContent);
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
                .map(([id, multilog]) => {
                    if (multilog instanceof Promise) {
                        return [id, undefined];
                    }

                    const newMultilog = new MultiLog(multilog.header, newNode);

                    newMultilog.sessions = multilog.sessions;

                    return [id, newMultilog];
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
