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
    encryptForTransaction,
    decryptForTransaction,
    sealKeySecret,
    unsealKeySecret,
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

test("Encryption for transactions round-trips", () => {
    const { secret } = newRandomKeySecret();

    const encrypted1 =  encryptForTransaction({ a: "hello" }, secret, {
        in: "coval_zTEST",
        tx: { sessionID: "session_zTEST_agent_zTEST", txIndex: 0 },
    });

    const encrypted2 = encryptForTransaction({ b: "world" }, secret, {
        in: "coval_zTEST",
        tx: { sessionID: "session_zTEST_agent_zTEST", txIndex: 1 },
    });

    const decrypted1 = decryptForTransaction(encrypted1, secret, {
        in: "coval_zTEST",
        tx: { sessionID: "session_zTEST_agent_zTEST", txIndex: 0 },
    });

    const decrypted2 =  decryptForTransaction(encrypted2, secret, {
        in: "coval_zTEST",
        tx: { sessionID: "session_zTEST_agent_zTEST", txIndex: 1 },
    });

    expect([decrypted1, decrypted2]).toEqual([{ a: "hello" }, { b: "world" }]);
});

test("Encryption for transactions doesn't decrypt with a wrong key", () => {
    const { secret } = newRandomKeySecret();
    const { secret: secret2 } = newRandomKeySecret();

    const encrypted1 =  encryptForTransaction({ a: "hello" }, secret, {
        in: "coval_zTEST",
        tx: { sessionID: "session_zTEST_agent_zTEST", txIndex: 0 },
    });

    const encrypted2 = encryptForTransaction({ b: "world" }, secret, {
        in: "coval_zTEST",
        tx: { sessionID: "session_zTEST_agent_zTEST", txIndex: 1 },
    });

    const decrypted1 = decryptForTransaction(encrypted1, secret2, {
        in: "coval_zTEST",
        tx: { sessionID: "session_zTEST_agent_zTEST", txIndex: 0 },
    });

    const decrypted2 =  decryptForTransaction(encrypted2, secret2, {
        in: "coval_zTEST",
        tx: { sessionID: "session_zTEST_agent_zTEST", txIndex: 1 },
    });

    expect([decrypted1, decrypted2]).toEqual([undefined, undefined]);
});

test("Encryption of keySecrets round-trips", () => {
    const toSeal = newRandomKeySecret();
    const sealing = newRandomKeySecret();

    const keys = {
        toSeal,
        sealing,
    };

    const sealed = sealKeySecret(keys);

    const unsealed = unsealKeySecret(sealed, sealing.secret);

    expect(unsealed).toEqual(toSeal.secret);
});

test("Encryption of keySecrets doesn't unseal with a wrong key", () => {
    const toSeal = newRandomKeySecret();
    const sealing = newRandomKeySecret();
    const sealingWrong = newRandomKeySecret();

    const keys = {
        toSeal,
        sealing,
    };

    const sealed = sealKeySecret(keys);

    const unsealed = unsealKeySecret(sealed, sealingWrong.secret);

    expect(unsealed).toBeUndefined();
});
