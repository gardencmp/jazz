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
} from "./multilog";
import { Team, expectTeamContent } from "./permissions";
import {
    NewContentMessage,
    Peer,
    PeerID,
    SessionNewContent,
    SubscribeMessage,
    SyncMessage,
    UnsubscribeMessage,
    WrongAssumedKnownStateMessage,
} from "./sync";

export class LocalNode {
    multilogs: { [key: MultiLogID]: Promise<MultiLog> | MultiLog } = {};
    peers: { [key: PeerID]: Peer } = {};
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

        const agentMultilog = new MultiLog(
            getAgentMultilogHeader(agent),
            agentCredential,
            ownSessionID,
            this.knownAgents,
            {}
        );
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

        const multilog = new MultiLog(
            header,
            this.agentCredential,
            this.ownSessionID,
            this.knownAgents,
            requiredMultiLogs
        );
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
        this.peers[peer.id] = peer;

        const writer = peer.outgoing.getWriter();

        for await (const msg of peer.incoming) {
            const response = this.handleSyncMessage(msg);

            if (response) {
                await writer.write(response);
            }
        }
    }

    handleSyncMessage(msg: SyncMessage): SyncMessage | undefined {
        // TODO: validate
        switch (msg.type) {
            case "subscribe":
                return this.handleSubscribe(msg);
            case "newContent":
                return this.handleNewContent(msg);
            case "wrongAssumedKnownState":
                return this.handleWrongAssumedKnownState(msg);
            case "unsubscribe":
                return this.handleUnsubscribe(msg);
        }
    }

    handleSubscribe(msg: SubscribeMessage): SyncMessage | undefined {
        const multilog = this.expectMultiLogLoaded(msg.knownState.multilogID);

        return {
            type: "newContent",
            multilogID: multilog.id,
            header: multilog.header,
            newContent: Object.fromEntries(
                Object.entries(multilog.sessions)
                    .map(([sessionID, log]) => {
                        const newTransactions = log.transactions.slice(
                            msg.knownState.sessions[sessionID as SessionID] || 0
                        );

                        if (
                            newTransactions.length === 0 ||
                            !log.lastHash ||
                            !log.lastSignature
                        ) {
                            return undefined;
                        }

                        return [
                            sessionID,
                            {
                                after:
                                    msg.knownState.sessions[
                                        sessionID as SessionID
                                    ] || 0,
                                newTransactions,
                                lastHash: log.lastHash,
                                lastSignature: log.lastSignature,
                            },
                        ];
                    })
                    .filter((x): x is Exclude<typeof x, undefined> => !!x)
            ),
        };
    }

    handleNewContent(msg: NewContentMessage): SyncMessage | undefined {}

    handleWrongAssumedKnownState(
        msg: WrongAssumedKnownStateMessage
    ): SyncMessage | undefined {}

    handleUnsubscribe(msg: UnsubscribeMessage): SyncMessage | undefined {}
}
