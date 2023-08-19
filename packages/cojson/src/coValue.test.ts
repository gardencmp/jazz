import { Transaction } from "./coValue.js";
import { LocalNode } from "./node.js";
import { createdNowUnique, getAgentSignerSecret, newRandomAgentSecret, sign } from "./crypto.js";
import { randomAnonymousAccountAndSessionID } from "./testUtils.js";
import { CoMap, MapOpPayload } from "./contentTypes/coMap.js";
import { AccountID } from "./index.js";
import { Role } from "./permissions.js";

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
            sign(account.currentSignerSecret(), expectedNewHash)
        )
    ).toBe(false);
});

test("New transactions in a team correctly update owned values, including subscriptions", async () => {
    const [account, sessionID] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(account, sessionID);

    const team = node.createTeam();

    const timeBeforeEdit = Date.now();

    await new Promise((resolve) => setTimeout(resolve, 10));

    let map = team.createMap();

    let mapAfterEdit = map.edit((map) => {
        map.set("hello", "world");
    });

    const listener = jest.fn().mockImplementation();

    map.subscribe(listener);

    expect(listener.mock.calls[0][0].get("hello")).toBe("world");

    const resignationThatWeJustLearnedAbout = {
        privacy: "trusting",
        madeAt: timeBeforeEdit,
        changes: [
            {
                op: "set",
                key: account.id,
                value: "revoked"
            } satisfies MapOpPayload<typeof account.id, Role>
        ]
    } satisfies Transaction;

    const { expectedNewHash } = team.teamMap.coValue.expectedNewHashAfter(sessionID, [
        resignationThatWeJustLearnedAbout,
    ]);

    const signature = sign(
        node.account.currentSignerSecret(),
        expectedNewHash
    );

    expect(map.coValue.getValidSortedTransactions().length).toBe(1);

    const manuallyAdddedTxSuccess = team.teamMap.coValue.tryAddTransactions(node.ownSessionID, [resignationThatWeJustLearnedAbout], expectedNewHash, signature);

    expect(manuallyAdddedTxSuccess).toBe(true);

    expect(listener.mock.calls.length).toBe(2);
    expect(listener.mock.calls[1][0].get("hello")).toBe(undefined);

    expect(map.coValue.getValidSortedTransactions().length).toBe(0);
});
