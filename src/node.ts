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

export class LocalNode {
    multilogs: { [key: MultiLogID]: Promise<MultiLog> | MultiLog } = {};
    // peers: {[key: Hostname]: Peer} = {};
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
        const requiredMultiLogs = header.ruleset.type === "ownedByTeam" ? {
            [header.ruleset.team]: this.expectMultiLogLoaded(header.ruleset.team)
        } : {};

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
}

// type Hostname = string;

// interface Peer {
//     hostname: Hostname;
//     incoming: ReadableStream<SyncMessage>;
//     outgoing: WritableStream<SyncMessage>;
//     optimisticKnownStates: {[multilogID: MultiLogID]: MultilogKnownState};
// }
