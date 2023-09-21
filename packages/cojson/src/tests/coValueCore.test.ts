import { Transaction } from "../coValueCore.js";
import { LocalNode } from "../localNode.js";
import { createdNowUnique, getAgentSignerSecret, newRandomAgentSecret, sign } from "../crypto.js";
import { randomAnonymousAccountAndSessionID } from "./testUtils.js";
import { MapOpPayload } from "../coValues/coMap.js";
import { Role } from "../permissions.js";
import { cojsonReady } from "../index.js";
import { stableStringify } from "../jsonStringify.js";

beforeEach(async () => {
    await cojsonReady;
});

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
        changes: stableStringify([
            {
                hello: "world",
            },
        ]),
    };

    const { expectedNewHash } = coValue.expectedNewHashAfter(
        node.currentSessionID,
        [transaction]
    );

    expect(
        coValue.tryAddTransactions(
            node.currentSessionID,
            [transaction],
            expectedNewHash,
            sign(account.currentSignerSecret(), expectedNewHash)
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
        changes: stableStringify([
            {
                hello: "world",
            },
        ]),
    };

    const { expectedNewHash } = coValue.expectedNewHashAfter(
        node.currentSessionID,
        [transaction]
    );

    expect(
        coValue.tryAddTransactions(
            node.currentSessionID,
            [transaction],
            expectedNewHash,
            sign(getAgentSignerSecret(wrongAgent), expectedNewHash)
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
        changes: stableStringify([
            {
                hello: "world",
            },
        ]),
    };

    const { expectedNewHash } = coValue.expectedNewHashAfter(
        node.currentSessionID,
        [
            {
                privacy: "trusting",
                madeAt: Date.now(),
                changes: stableStringify([
                    {
                        hello: "wrong",
                    },
                ]),
            },
        ]
    );

    expect(
        coValue.tryAddTransactions(
            node.currentSessionID,
            [transaction],
            expectedNewHash,
            sign(account.currentSignerSecret(), expectedNewHash)
        )
    ).toBe(false);
});

test("New transactions in a group correctly update owned values, including subscriptions", async () => {
    const [account, sessionID] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(account, sessionID);

    const group = node.createGroup();

    const timeBeforeEdit = Date.now();

    await new Promise((resolve) => setTimeout(resolve, 10));

    let map = group.createMap();

    let mapAfterEdit = map.edit((map) => {
        map.set("hello", "world");
    });

    const listener = jest.fn().mockImplementation();

    map.subscribe(listener);

    expect(listener.mock.calls[0][0].get("hello")).toBe("world");

    const resignationThatWeJustLearnedAbout = {
        privacy: "trusting",
        madeAt: timeBeforeEdit,
        changes: stableStringify([
            {
                op: "set",
                key: account.id,
                value: "revoked"
            } satisfies MapOpPayload<typeof account.id, Role>
        ])
    } satisfies Transaction;

    const { expectedNewHash } = group.underlyingMap.core.expectedNewHashAfter(sessionID, [
        resignationThatWeJustLearnedAbout,
    ]);

    const signature = sign(
        node.account.currentSignerSecret(),
        expectedNewHash
    );

    expect(map.core.getValidSortedTransactions().length).toBe(1);

    const manuallyAdddedTxSuccess = group.underlyingMap.core.tryAddTransactions(node.currentSessionID, [resignationThatWeJustLearnedAbout], expectedNewHash, signature);

    expect(manuallyAdddedTxSuccess).toBe(true);

    expect(listener.mock.calls.length).toBe(2);
    expect(listener.mock.calls[1][0].get("hello")).toBe(undefined);

    expect(map.core.getValidSortedTransactions().length).toBe(0);
});
