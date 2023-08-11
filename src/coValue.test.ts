import {
    Transaction,
    getAgent,
    getAgentID,
    newRandomAgentCredential,
    newRandomSessionID,
} from './coValue.js';
import { LocalNode } from './node.js';
import { createdNowUnique, sign } from './crypto.js';

test("Can create coValue with new agent credentials and add transaction to it", () => {
    const agentCredential = newRandomAgentCredential("agent1");
    const node = new LocalNode(
        agentCredential,
        newRandomSessionID(getAgentID(getAgent(agentCredential)))
    );

    const coValue = node.createCoValue({
        type: "costream",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...createdNowUnique()
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
    const wrongAgent = newRandomAgentCredential("wrongAgent");
    const agentCredential = newRandomAgentCredential("agent1");
    const node = new LocalNode(
        agentCredential,
        newRandomSessionID(getAgentID(getAgent(agentCredential)))
    );

    const coValue = node.createCoValue({
        type: "costream",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...createdNowUnique()
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
    const agentCredential = newRandomAgentCredential("agent1");
    const node = new LocalNode(
        agentCredential,
        newRandomSessionID(getAgentID(getAgent(agentCredential)))
    );

    const coValue = node.createCoValue({
        type: "costream",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...createdNowUnique()
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
            sign(agentCredential.signatorySecret, expectedNewHash)
        )
    ).toBe(false);
});
