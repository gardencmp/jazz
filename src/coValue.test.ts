import { expect, test } from "bun:test";
import {
    CoValue,
    Transaction,
    getAgent,
    getAgentID,
    newRandomAgentCredential,
    newRandomSessionID,
} from "./coValue";
import { LocalNode } from "./node";
import { sign } from "./crypto";

test("Can create coValue with new agent credentials and add transaction to it", () => {
    const agentCredential = newRandomAgentCredential();
    const node = new LocalNode(
        agentCredential,
        newRandomSessionID(getAgentID(getAgent(agentCredential)))
    );

    const coValue = node.createCoValue({
        type: "costream",
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

    const { expectedNewHash } = coValue.expectedNewHashAfter(
        node.ownSessionID,
        [transaction]
    );

    expect(
        coValue.tryAddTransactions(
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

    const coValue = node.createCoValue({
        type: "costream",
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

    const { expectedNewHash } = coValue.expectedNewHashAfter(
        node.ownSessionID,
        [transaction]
    );

    expect(
        coValue.tryAddTransactions(
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

    const coValue = node.createCoValue({
        type: "costream",
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

    const { expectedNewHash } = coValue.expectedNewHashAfter(
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
        coValue.tryAddTransactions(
            node.ownSessionID,
            [transaction],
            expectedNewHash,
            sign(agent.signatorySecret, expectedNewHash)
        )
    ).toBe(false);
});
