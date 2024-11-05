import { describe, expect, test, vi } from "vitest";
import { PeerKnownStates } from "../PeerKnownStates.js";
import { RawCoID, SessionID } from "../ids.js";
import { CoValueKnownState, emptyKnownState } from "../sync.js";

describe("PeerKnownStates", () => {
  test("should set and get a known state", () => {
    const peerKnownStates = new PeerKnownStates();
    const id = "test-id" as RawCoID;
    const knownState: CoValueKnownState = emptyKnownState(id);

    peerKnownStates.dispatch({ type: "SET", id, value: knownState });

    expect(peerKnownStates.get(id)).toEqual(knownState);
    expect(peerKnownStates.has(id)).toBe(true);
  });

  test("should update header", () => {
    const peerKnownStates = new PeerKnownStates();
    const id = "test-id" as RawCoID;

    peerKnownStates.dispatch({ type: "UPDATE_HEADER", id, header: true });

    const result = peerKnownStates.get(id);
    expect(result?.header).toBe(true);
  });

  test("should update session counter", () => {
    const peerKnownStates = new PeerKnownStates();
    const id = "test-id" as RawCoID;
    const sessionId = "session-1" as SessionID;

    peerKnownStates.dispatch({
      type: "UPDATE_SESSION_COUNTER",
      id,
      sessionId,
      value: 5,
    });

    const result = peerKnownStates.get(id);
    expect(result?.sessions[sessionId]).toBe(5);
  });

  test("should combine with existing state", () => {
    const peerKnownStates = new PeerKnownStates();
    const id = "test-id" as RawCoID;
    const session1 = "session-1" as SessionID;
    const session2 = "session-2" as SessionID;
    const initialState: CoValueKnownState = {
      ...emptyKnownState(id),
      sessions: { [session1]: 5 },
    };
    const combineState: CoValueKnownState = {
      ...emptyKnownState(id),
      sessions: { [session2]: 10 },
    };

    peerKnownStates.dispatch({ type: "SET", id, value: initialState });
    peerKnownStates.dispatch({ type: "COMBINE_WITH", id, value: combineState });

    const result = peerKnownStates.get(id);
    expect(result?.sessions).toEqual({ [session1]: 5, [session2]: 10 });
  });

  test("should set as empty", () => {
    const peerKnownStates = new PeerKnownStates();
    const id = "test-id" as RawCoID;
    const sessionId = "session-1" as SessionID;
    const initialState: CoValueKnownState = {
      ...emptyKnownState(id),
      sessions: { [sessionId]: 5 },
    };

    peerKnownStates.dispatch({ type: "SET", id, value: initialState });
    peerKnownStates.dispatch({ type: "SET_AS_EMPTY", id });

    const result = peerKnownStates.get(id);
    expect(result).toEqual(emptyKnownState(id));
  });

  test("should trigger listeners on dispatch", () => {
    const peerKnownStates = new PeerKnownStates();
    const id = "test-id" as RawCoID;
    const listener = vi.fn();

    peerKnownStates.subscribe(listener);
    peerKnownStates.dispatch({ type: "SET_AS_EMPTY", id });

    expect(listener).toHaveBeenCalledWith(id, emptyKnownState(id));
  });

  test("should unsubscribe listener", () => {
    const peerKnownStates = new PeerKnownStates();
    const id = "test-id" as RawCoID;
    const listener = vi.fn();

    const unsubscribe = peerKnownStates.subscribe(listener);
    unsubscribe();

    peerKnownStates.dispatch({ type: "SET_AS_EMPTY", id });

    expect(listener).not.toHaveBeenCalled();
  });
});
