import { expect, test } from "bun:test";
import {
    getRecipientID,
    getSignatoryID,
    secureHash,
    newRandomRecipient,
    newRandomSignatory,
    seal,
    sign,
    openAs,
    verify,
    shortHash,
    newRandomKeySecret,
    encrypt,
    decrypt,
} from "./crypto";
import { base58, base64url } from "@scure/base";
import { x25519 } from "@noble/curves/ed25519";
import { xsalsa20_poly1305 } from "@noble/ciphers/_slow";
import { blake3 } from "@noble/hashes/blake3";
import stableStringify from "fast-json-stable-stringify";

test("Signatures round-trip and use stable stringify", () => {
    const data = { b: "world", a: "hello" };
    const signatory = newRandomSignatory();
    const signature = sign(signatory, data);

    expect(signature).toMatch(/^signature_z/);
    expect(
        verify(signature, { a: "hello", b: "world" }, getSignatoryID(signatory))
    ).toBe(true);
});

test("Invalid signatures don't verify", () => {
    const data = { b: "world", a: "hello" };
    const signatory = newRandomSignatory();
    const signatory2 = newRandomSignatory();
    const wrongSignature = sign(signatory2, data);

    expect(verify(wrongSignature, data, getSignatoryID(signatory))).toBe(false);
});

test("Sealing round-trips, but invalid receiver can't unseal", () => {
    const data = { b: "world", a: "hello" };
    const sender = newRandomRecipient();
    const recipient1 = newRandomRecipient();
    const recipient2 = newRandomRecipient();
    const recipient3 = newRandomRecipient();

    const nOnceMaterial = {
        in: "coval_zTEST",
        tx: { sessionID: "session_zTEST_agent_zTEST", txIndex: 0 },
    } as const;

    const sealed = seal(
        data,
        sender,
        new Set([getRecipientID(recipient1), getRecipientID(recipient2)]),
        nOnceMaterial
    );

    expect(sealed[getRecipientID(recipient1)]).toMatch(/^sealed_U/);
    expect(sealed[getRecipientID(recipient2)]).toMatch(/^sealed_U/);
    expect(
        openAs(sealed, recipient1, getRecipientID(sender), nOnceMaterial)
    ).toEqual(data);
    expect(
        openAs(sealed, recipient2, getRecipientID(sender), nOnceMaterial)
    ).toEqual(data);
    expect(
        openAs(sealed, recipient3, getRecipientID(sender), nOnceMaterial)
    ).toBeUndefined();

    // trying with wrong recipient secret, by hand
    const nOnce = blake3(
        new TextEncoder().encode(stableStringify(nOnceMaterial))
    ).slice(0, 24);
    const recipient3priv = base58.decode(
        recipient3.substring("recipientSecret_z".length)
    );
    const senderPub = base58.decode(
        getRecipientID(sender).substring("recipient_z".length)
    );
    const sealedBytes = base64url.decode(
        sealed[getRecipientID(recipient1)].substring("sealed_U".length)
    );
    const sharedSecret = x25519.getSharedSecret(recipient3priv, senderPub);

    expect(() => {
        const _ = xsalsa20_poly1305(sharedSecret, nOnce).decrypt(sealedBytes);
    }).toThrow("Wrong tag");
});

test("Hashing is deterministic", () => {
    expect(secureHash({ b: "world", a: "hello" })).toEqual(
        secureHash({ a: "hello", b: "world" })
    );

    expect(shortHash({ b: "world", a: "hello" })).toEqual(
        shortHash({ a: "hello", b: "world" })
    );
});

test("Encryption streams round-trip", () => {
    const { secret } = newRandomKeySecret();

    const encryptedChunks = [
        encrypt({ a: "hello" }, secret, {
            in: "coval_zTEST",
            tx: { sessionID: "session_zTEST_agent_zTEST", txIndex: 0 },
        }),
        encrypt({ b: "world" }, secret, {
            in: "coval_zTEST",
            tx: { sessionID: "session_zTEST_agent_zTEST", txIndex: 1 },
        }),
    ];

    const decryptedChunks = encryptedChunks.map((chunk, i) =>
        decrypt(chunk, secret, {
            in: "coval_zTEST",
            tx: { sessionID: "session_zTEST_agent_zTEST", txIndex: i },
        })
    );

    expect(decryptedChunks).toEqual([{ a: "hello" }, { b: "world" }]);
});

test("Encryption streams don't decrypt with a wrong key", () => {
    const { secret } = newRandomKeySecret();
    const { secret: secret2 } = newRandomKeySecret();

    const encryptedChunks = [
        encrypt({ a: "hello" }, secret, {
            in: "coval_zTEST",
            tx: { sessionID: "session_zTEST_agent_zTEST", txIndex: 0 },
        }),
        encrypt({ b: "world" }, secret, {
            in: "coval_zTEST",
            tx: { sessionID: "session_zTEST_agent_zTEST", txIndex: 1 },
        }),
    ];

    const decryptedChunks = encryptedChunks.map((chunk, i) =>
        decrypt(chunk, secret2, {
            in: "coval_zTEST",
            tx: { sessionID: "session_zTEST_agent_zTEST", txIndex: i },
        })
    );

    expect(decryptedChunks).toEqual([undefined, undefined]);
});
