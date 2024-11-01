import { RawCoID, SessionID } from "./ids.js";
import { CoValueKnownState, emptyKnownState, combinedKnownStates } from "./sync.js";

type PeerKnownStateActions = {
    type: "SET_AS_EMPTY";
    id: RawCoID;
} | {
    type: "UPDATE_HEADER";
    id: RawCoID;
    header: boolean;
} |
{
    type: "UPDATE_SESSION_COUNTER";
    id: RawCoID;
    sessionId: SessionID;
    value: number;
} |
{
    type: "SET";
    id: RawCoID;
    value: CoValueKnownState;
} |
{
    type: "COMBINE_WITH";
    id: RawCoID;
    value: CoValueKnownState;
};

export class PeerKnownStates {
    private coValues = new Map<RawCoID, CoValueKnownState>();

    private updateHeader(id: RawCoID, header: boolean) {
        const knownState = this.coValues.get(id) ?? emptyKnownState(id);
        knownState.header = header;
        this.coValues.set(id, knownState);
    }

    private combineWith(id: RawCoID, value: CoValueKnownState) {
        const knownState = this.coValues.get(id) ?? emptyKnownState(id);
        this.coValues.set(id, combinedKnownStates(knownState, value));
    }

    private updateSessionCounter(
        id: RawCoID,
        sessionId: SessionID,
        value: number
    ) {
        const knownState = this.coValues.get(id) ?? emptyKnownState(id);
        const currentValue = knownState.sessions[sessionId] || 0;
        knownState.sessions[sessionId] = Math.max(currentValue, value);

        this.coValues.set(id, knownState);
    }

    get(id: RawCoID) {
        return this.coValues.get(id);
    }

    has(id: RawCoID) {
        return this.coValues.has(id);
    }

    dispatch(action: PeerKnownStateActions) {
        switch (action.type) {
            case "UPDATE_HEADER":
                this.updateHeader(action.id, action.header);
                break;
            case "UPDATE_SESSION_COUNTER":
                this.updateSessionCounter(
                    action.id,
                    action.sessionId,
                    action.value
                );
                break;
            case "SET":
                this.coValues.set(action.id, action.value);
                break;
            case "COMBINE_WITH":
                this.combineWith(action.id, action.value);
                break;
            case "SET_AS_EMPTY":
                this.coValues.set(action.id, emptyKnownState(action.id));
                break;
        }

        this.triggerUpdate(action.id);
    }

    listeners = new Set<(id: RawCoID, knownState: CoValueKnownState) => void>();

    triggerUpdate(id: RawCoID) {
        this.trigger(id, this.coValues.get(id) ?? emptyKnownState(id));
    }

    private trigger(id: RawCoID, knownState: CoValueKnownState) {
        for (const listener of this.listeners) {
            listener(id, knownState);
        }
    }

    subscribe(listener: (id: RawCoID, knownState: CoValueKnownState) => void) {
        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
    }
}
