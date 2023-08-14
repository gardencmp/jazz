import { Transaction } from "./coValue.js";
import { LocalNode } from "./node.js";
import { createdNowUnique, getAgentSignatorySecret, newRandomAgentSecret, sign } from "./crypto.js";
import { randomAnonymousAccountAndSessionID } from "./testUtils.js";

test("Can create coValue with new agent credentials and add transaction to it", () => {
    const [account, sessionID] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(account, sessionID);

    const coValue = node.createCoValue({
        type: "costream",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...createdNowUnique(),
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
            sign(account.currentSignatorySecret(), expectedNewHash)
        )
    ).toBe(true);
});

test("transactions with wrong signature are rejected", () => {
    const wrongAgent = newRandomAgentSecret();
    const [agentSecret, sessionID] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(agentSecret, sessionID);

    const coValue = node.createCoValue({
        type: "costream",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...createdNowUnique(),
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
            sign(getAgentSignatorySecret(wrongAgent), expectedNewHash)
        )
    ).toBe(false);
});

test("transactions with correctly signed, but wrong hash are rejected", () => {
    const [account, sessionID] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(account, sessionID);

    const coValue = node.createCoValue({
        type: "costream",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...createdNowUnique(),
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
            sign(account.currentSignatorySecret(), expectedNewHash)
        )
    ).toBe(false);
});
