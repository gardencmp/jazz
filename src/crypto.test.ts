import {
    getRecipientID,
    getSignatoryID,
    secureHash,
    newRandomRecipient,
    newRandomSignatory,
    seal,
    sign,
    unseal,
    verify,
    shortHash,
    newRandomKeySecret,
    encryptForTransaction,
    decryptForTransaction,
    encryptKeySecret,
    decryptKeySecret,
} from './crypto.js';
import { base58, base64url } from "@scure/base";
import { x25519 } from "@noble/curves/ed25519";
import { xsalsa20_poly1305 } from "@noble/ciphers/salsa";
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

test("encrypting round-trips, but invalid receiver can't unseal", () => {
    const data = { b: "world", a: "hello" };
    const sender = newRandomRecipient();
    const recipient = newRandomRecipient();
    const wrongRecipient = newRandomRecipient();

    const nOnceMaterial = {
        in: "co_zTEST",
        tx: { sessionID: "co_agent_zTEST_session_zTEST", txIndex: 0 },
    } as const;

    const sealed = seal(
        data,
        sender,
        getRecipientID(recipient),
        nOnceMaterial
    );

    expect(
        unseal(sealed, recipient, getRecipientID(sender), nOnceMaterial)
    ).toEqual(data);
    expect(
        () => unseal(sealed, wrongRecipient, getRecipientID(sender), nOnceMaterial)
    ).toThrow(/Wrong tag/);

    // trying with wrong recipient secret, by hand
    const nOnce = blake3(
        new TextEncoder().encode(stableStringify(nOnceMaterial))
    ).slice(0, 24);
    const recipient3priv = base58.decode(
        wrongRecipient.substring("recipientSecret_z".length)
    );
    const senderPub = base58.decode(
        getRecipientID(sender).substring("recipient_z".length)
    );
    const sealedBytes = base64url.decode(
        sealed.substring("sealed_U".length)
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
        in: "co_zTEST",
        tx: { sessionID: "co_agent_zTEST_session_zTEST", txIndex: 0 },
    });

    const encrypted2 = encryptForTransaction({ b: "world" }, secret, {
        in: "co_zTEST",
        tx: { sessionID: "co_agent_zTEST_session_zTEST", txIndex: 1 },
    });

    const decrypted1 = decryptForTransaction(encrypted1, secret, {
        in: "co_zTEST",
        tx: { sessionID: "co_agent_zTEST_session_zTEST", txIndex: 0 },
    });

    const decrypted2 =  decryptForTransaction(encrypted2, secret, {
        in: "co_zTEST",
        tx: { sessionID: "co_agent_zTEST_session_zTEST", txIndex: 1 },
    });

    expect([decrypted1, decrypted2]).toEqual([{ a: "hello" }, { b: "world" }]);
});

test("Encryption for transactions doesn't decrypt with a wrong key", () => {
    const { secret } = newRandomKeySecret();
    const { secret: secret2 } = newRandomKeySecret();

    const encrypted1 =  encryptForTransaction({ a: "hello" }, secret, {
        in: "co_zTEST",
        tx: { sessionID: "co_agent_zTEST_session_zTEST", txIndex: 0 },
    });

    const encrypted2 = encryptForTransaction({ b: "world" }, secret, {
        in: "co_zTEST",
        tx: { sessionID: "co_agent_zTEST_session_zTEST", txIndex: 1 },
    });

    const decrypted1 = decryptForTransaction(encrypted1, secret2, {
        in: "co_zTEST",
        tx: { sessionID: "co_agent_zTEST_session_zTEST", txIndex: 0 },
    });

    const decrypted2 =  decryptForTransaction(encrypted2, secret2, {
        in: "co_zTEST",
        tx: { sessionID: "co_agent_zTEST_session_zTEST", txIndex: 1 },
    });

    expect([decrypted1, decrypted2]).toEqual([undefined, undefined]);
});

test("Encryption of keySecrets round-trips", () => {
    const toEncrypt = newRandomKeySecret();
    const encrypting = newRandomKeySecret();

    const keys = {
        toEncrypt,
        encrypting,
    };

    const encrypted = encryptKeySecret(keys);

    const decrypted = decryptKeySecret(encrypted, encrypting.secret);

    expect(decrypted).toEqual(toEncrypt.secret);
});

test("Encryption of keySecrets doesn't decrypt with a wrong key", () => {
    const toEncrypt = newRandomKeySecret();
    const encrypting = newRandomKeySecret();
    const encryptingWrong = newRandomKeySecret();

    const keys = {
        toEncrypt,
        encrypting,
    };

    const encrypted = encryptKeySecret(keys);

    const decrypted = decryptKeySecret(encrypted, encryptingWrong.secret);

    expect(decrypted).toBeUndefined();
});
