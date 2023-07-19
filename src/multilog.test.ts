import { expect, test } from "bun:test";
import {
    MultiLog,
    Transaction,
    getAgent,
    getAgentID,
    newRandomAgentCredential,
    newRandomSessionID,
} from "./multilog";
import { LocalNode } from "./node";
import { sign } from "./crypto";

test("Can create multilog with new agent credentials and add transaction to it", () => {
    const agentCredential = newRandomAgentCredential();
    const node = new LocalNode(
        agentCredential,
        newRandomSessionID(getAgentID(getAgent(agentCredential)))
    );

    const multilog = node.createMultiLog({
        type: "multistream",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
    });

    const transaction: Transaction = {
        privacy: "trusting",
        madeAt: Date.now(),
        changes: [
            {
                hello: "world",
            },
        ],
    };

    const { expectedNewHash } = multilog.expectedNewHashAfter(
        node.ownSessionID,
        [transaction]
    );

    expect(
        multilog.tryAddTransactions(
            node.ownSessionID,
            [transaction],
            expectedNewHash,
            sign(agentCredential.signatorySecret, expectedNewHash)
        )
    ).toBe(true);
});

test("transactions with wrong signature are rejected", () => {
    const agent = newRandomAgentCredential();
    const wrongAgent = newRandomAgentCredential();
    const agentCredential = newRandomAgentCredential();
    const node = new LocalNode(
        agentCredential,
        newRandomSessionID(getAgentID(getAgent(agentCredential)))
    );

    const multilog = node.createMultiLog({
        type: "multistream",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
    });

    const transaction: Transaction = {
        privacy: "trusting",
        madeAt: Date.now(),
        changes: [
            {
                hello: "world",
            },
        ],
    };

    const { expectedNewHash } = multilog.expectedNewHashAfter(
        node.ownSessionID,
        [transaction]
    );

    expect(
        multilog.tryAddTransactions(
            node.ownSessionID,
            [transaction],
            expectedNewHash,
            sign(wrongAgent.signatorySecret, expectedNewHash)
        )
    ).toBe(false);
});

test("transactions with correctly signed, but wrong hash are rejected", () => {
    const agent = newRandomAgentCredential();
    const agentCredential = newRandomAgentCredential();
    const node = new LocalNode(
        agentCredential,
        newRandomSessionID(getAgentID(getAgent(agentCredential)))
    );

    const multilog = node.createMultiLog({
        type: "multistream",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
    });

    const transaction: Transaction = {
        privacy: "trusting",
        madeAt: Date.now(),
        changes: [
            {
                hello: "world",
            },
        ],
    };

    const { expectedNewHash } = multilog.expectedNewHashAfter(
        node.ownSessionID,
        [
            {
                privacy: "trusting",
                madeAt: Date.now(),
                changes: [
                    {
                        hello: "wrong",
                    },
                ],
            },
        ]
    );

    expect(
        multilog.tryAddTransactions(
            node.ownSessionID,
            [transaction],
            expectedNewHash,
            sign(agent.signatorySecret, expectedNewHash)
        )
    ).toBe(false);
});
