import { expect, test } from "bun:test";
import {
    getRecipientID,
    getSignatoryID,
    secureHash,
    newRandomRecipient,
    newRandomSignatory,
    sealFor,
    sign,
    unsealAs,
    verify,
    shortHash,
    newRandomSecretKey,
    EncryptionStream,
    DecryptionStream,
} from "./crypto";

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

test("Sealing round-trips", () => {
    const data = { b: "world", a: "hello" };
    const recipient = newRandomRecipient();
    const sealed = sealFor(getRecipientID(recipient), data);

    expect(sealed).toMatch(/^sealed_U/);
    expect(unsealAs(recipient, sealed)).toEqual(data);
});

test("Invalid receiver can't unseal", () => {
    const data = { b: "world", a: "hello" };
    const recipient = newRandomRecipient();
    const recipient2 = newRandomRecipient();
    const sealed = sealFor(getRecipientID(recipient), data);

    expect(unsealAs(recipient2, sealed)).toBeUndefined();
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
    const secretKey = newRandomSecretKey();
    const nonce = new Uint8Array(24);

    const encryptionStream = new EncryptionStream(secretKey, nonce);
    const decryptionStream = new DecryptionStream(secretKey, nonce);

    const encryptedChunks = [
        encryptionStream.encrypt({ a: "hello" }),
        encryptionStream.encrypt({ b: "world" }),
    ];

    const decryptedChunks = encryptedChunks.map((chunk) =>
        decryptionStream.decrypt(chunk)
    );

    expect(decryptedChunks).toEqual([{ a: "hello" }, { b: "world" }]);
});

test("Encryption streams don't decrypt with a wrong key", () => {
    const secretKey = newRandomSecretKey();
    const secretKey2 = newRandomSecretKey();
    const nonce = new Uint8Array(24);

    const encryptionStream = new EncryptionStream(secretKey, nonce);
    const decryptionStream = new DecryptionStream(secretKey2, nonce);

    const encryptedChunks = [
        encryptionStream.encrypt({ a: "hello" }),
        encryptionStream.encrypt({ b: "world" }),
    ];

    const decryptedChunks = encryptedChunks.map((chunk) =>
        decryptionStream.decrypt(chunk)
    );

    expect(decryptedChunks).toEqual([undefined, undefined]);
});
