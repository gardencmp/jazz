import { expect, test, vi } from "vitest";
import { Transaction } from "../coValueCore.js";
import { LocalNode } from "../localNode.js";
import { randomAnonymousAccountAndSessionID } from "./testUtils.js";
import { MapOpPayload } from "../coValues/coMap.js";
import { Role } from "../permissions.js";
import { stableStringify } from "../jsonStringify.js";
import { WasmCrypto } from "../crypto/WasmCrypto.js";

const Crypto = await WasmCrypto.create();

test("Can create coValue with new agent credentials and add transaction to it", () => {
    const [account, sessionID] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(account, sessionID, Crypto);

    const coValue = node.createCoValue({
        type: "costream",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...Crypto.createdNowUnique(),
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
        [transaction],
    );

    expect(
        coValue
            .tryAddTransactions(
                node.currentSessionID,
                [transaction],
                expectedNewHash,
                Crypto.sign(account.currentSignerSecret(), expectedNewHash),
            )
            ._unsafeUnwrap(),
    ).toBe(true);
});

test("transactions with wrong signature are rejected", () => {
    const wrongAgent = Crypto.newRandomAgentSecret();
    const [agentSecret, sessionID] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(agentSecret, sessionID, Crypto);

    const coValue = node.createCoValue({
        type: "costream",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...Crypto.createdNowUnique(),
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
        [transaction],
    );

    // eslint-disable-next-line neverthrow/must-use-result
    coValue
        .tryAddTransactions(
            node.currentSessionID,
            [transaction],
            expectedNewHash,
            Crypto.sign(
                Crypto.getAgentSignerSecret(wrongAgent),
                expectedNewHash,
            ),
        )
        ._unsafeUnwrapErr({ withStackTrace: true });
});

test("transactions with correctly signed, but wrong hash are rejected", () => {
    const [account, sessionID] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(account, sessionID, Crypto);

    const coValue = node.createCoValue({
        type: "costream",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        ...Crypto.createdNowUnique(),
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
        ],
    );

    // eslint-disable-next-line neverthrow/must-use-result
    coValue
        .tryAddTransactions(
            node.currentSessionID,
            [transaction],
            expectedNewHash,
            Crypto.sign(account.currentSignerSecret(), expectedNewHash),
        )
        ._unsafeUnwrapErr({ withStackTrace: true });
});

test("New transactions in a group correctly update owned values, including subscriptions", async () => {
    const [account, sessionID] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(account, sessionID, Crypto);

    const group = node.createGroup();

    const timeBeforeEdit = Date.now();

    await new Promise((resolve) => setTimeout(resolve, 10));

    const map = group.createMap();

    map.set("hello", "world");

    const listener = vi.fn();

    map.subscribe(listener);

    expect(listener.mock.calls[0][0].get("hello")).toBe("world");

    const resignationThatWeJustLearnedAbout = {
        privacy: "trusting",
        madeAt: timeBeforeEdit,
        changes: stableStringify([
            {
                op: "set",
                key: account.id,
                value: "revoked",
            } satisfies MapOpPayload<typeof account.id, Role>,
        ]),
    } satisfies Transaction;

    const { expectedNewHash } = group.core.expectedNewHashAfter(sessionID, [
        resignationThatWeJustLearnedAbout,
    ]);

    const signature = Crypto.sign(
        node.account.currentSignerSecret(),
        expectedNewHash,
    );

    expect(map.core.getValidSortedTransactions().length).toBe(1);

    const manuallyAdddedTxSuccess = group.core
        .tryAddTransactions(
            node.currentSessionID,
            [resignationThatWeJustLearnedAbout],
            expectedNewHash,
            signature,
        )
        ._unsafeUnwrap({ withStackTrace: true });

    expect(manuallyAdddedTxSuccess).toBe(true);

    expect(listener.mock.calls.length).toBe(2);
    expect(listener.mock.calls[1][0].get("hello")).toBe(undefined);

    expect(map.core.getValidSortedTransactions().length).toBe(0);
});
