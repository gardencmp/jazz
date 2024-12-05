import type { CojsonInternalTypes, SessionID, Stringified } from "cojson";
import { describe, expect, it } from "vitest";
import { getDependedOnCoValues } from "../syncUtils.js";

function getMockedSessionID(accountId?: `co_z${string}`) {
  return `${accountId ?? getMockedCoValueId()}_session_z${Math.random().toString(36).substring(2, 15)}`;
}

function getMockedCoValueId() {
  return `co_z${Math.random().toString(36).substring(2, 15)}` as const;
}

function generateNewContentMessage(
  privacy: "trusting" | "private",
  changes: any[],
  accountId?: `co_z${string}`,
) {
  return {
    action: "content",
    id: getMockedCoValueId(),
    new: {
      [getMockedSessionID(accountId)]: {
        after: 0,
        lastSignature: "signature_z123",
        newTransactions: [
          {
            privacy,
            madeAt: 0,
            changes: JSON.stringify(changes) as any,
          },
        ],
      },
    },
    priority: 0,
  } as CojsonInternalTypes.NewContentMessage;
}

describe("getDependedOnCoValues", () => {
  it("should return dependencies for group ruleset", () => {
    const coValueRow = {
      id: "co_test",
      header: {
        ruleset: {
          type: "group",
        },
      },
    } as any;

    const result = getDependedOnCoValues({
      coValueRow,
      newContentMessages: [
        generateNewContentMessage("trusting", [
          { op: "set", key: "co_zabc123", value: "test" },
          { op: "set", key: "parent_co_zdef456", value: "test" },
          { op: "set", key: "normal_key", value: "test" },
        ]),
      ],
    });

    expect(result).toEqual(["co_zabc123", "co_zdef456"]);
  });

  it("should not throw on malformed JSON", () => {
    const coValueRow = {
      id: "co_test",
      header: {
        ruleset: {
          type: "group",
        },
      },
    } as any;

    const message = generateNewContentMessage("trusting", [
      { op: "set", key: "co_zabc123", value: "test" },
    ]);

    message.new["invalid_session" as SessionID] = {
      after: 0,
      lastSignature: "signature_z123",
      newTransactions: [
        {
          privacy: "trusting",
          madeAt: 0,
          changes: "}{-:)" as Stringified<CojsonInternalTypes.JsonObject[]>,
        },
      ],
    };

    const result = getDependedOnCoValues({
      coValueRow,
      newContentMessages: [message],
    });

    expect(result).toEqual(["co_zabc123"]);
  });

  it("should return dependencies for ownedByGroup ruleset", () => {
    const groupId = getMockedCoValueId();
    const coValueRow = {
      id: "co_owner",
      header: {
        ruleset: {
          type: "ownedByGroup",
          group: groupId,
        },
      },
    } as any;

    const accountId = getMockedCoValueId();
    const message = generateNewContentMessage(
      "trusting",
      [
        { op: "set", key: "co_zabc123", value: "test" },
        { op: "set", key: "parent_co_zdef456", value: "test" },
        { op: "set", key: "normal_key", value: "test" },
      ],
      accountId,
    );

    message.new["invalid_session" as SessionID] = {
      after: 0,
      lastSignature: "signature_z123",
      newTransactions: [],
    };

    const result = getDependedOnCoValues({
      coValueRow,
      newContentMessages: [message],
    });

    expect(result).toEqual([groupId, accountId]);
  });

  it("should return empty array for other ruleset types", () => {
    const coValueRow = {
      id: "co_test",
      header: {
        ruleset: {
          type: "other",
        },
      },
    } as any;

    const result = getDependedOnCoValues({
      coValueRow,
      newContentMessages: [
        generateNewContentMessage("trusting", [
          { op: "set", key: "co_zabc123", value: "test" },
          { op: "set", key: "parent_co_zdef456", value: "test" },
          { op: "set", key: "normal_key", value: "test" },
        ]),
      ],
    });

    expect(result).toEqual([]);
  });

  it("should ignore non-trusting transactions in group ruleset", () => {
    const coValueRow = {
      id: "co_test",
      header: {
        ruleset: {
          type: "group",
        },
      },
    } as any;

    const result = getDependedOnCoValues({
      coValueRow,
      newContentMessages: [
        generateNewContentMessage("private", [
          { op: "set", key: "co_zabc123", value: "test" },
        ]),
      ],
    });

    expect(result).toEqual([]);
  });
});
