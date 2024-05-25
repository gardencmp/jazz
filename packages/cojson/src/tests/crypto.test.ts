import { expect, test } from "vitest";
import { WasmCrypto } from "../crypto/WasmCrypto.js";
import { base58, base64url } from "@scure/base";
import { x25519 } from "@noble/curves/ed25519";
import { xsalsa20_poly1305 } from "@noble/ciphers/salsa";
import { blake3 } from "@noble/hashes/blake3";
import { SessionID } from "../ids.js";
import { stableStringify } from "../jsonStringify.js";

const Crypto = await WasmCrypto.create();

test("Signatures round-trip and use stable stringify", () => {
    const data = { b: "world", a: "hello" };
    const signer = Crypto.newRandomSigner();
    const signature = Crypto.sign(signer, data);

    expect(signature).toMatch(/^signature_z/);
    expect(
        Crypto.verify(
            signature,
            { a: "hello", b: "world" },
            Crypto.getSignerID(signer),
        ),
    ).toBe(true);
});

test("Invalid signatures don't verify", () => {
    const data = { b: "world", a: "hello" };
    const signer = Crypto.newRandomSigner();
    const signer2 = Crypto.newRandomSigner();
    const wrongSignature = Crypto.sign(signer2, data);

    expect(
        Crypto.verify(wrongSignature, data, Crypto.getSignerID(signer)),
    ).toBe(false);
});

test("encrypting round-trips, but invalid receiver can't unseal", () => {
    const data = { b: "world", a: "hello" };
    const sender = Crypto.newRandomSealer();
    const sealer = Crypto.newRandomSealer();
    const wrongSealer = Crypto.newRandomSealer();

    const nOnceMaterial = {
        in: "co_zTEST",
        tx: { sessionID: "co_zTEST_session_zTEST" as SessionID, txIndex: 0 },
    } as const;

    const sealed = Crypto.seal({
        message: data,
        from: sender,
        to: Crypto.getSealerID(sealer),
        nOnceMaterial,
    });

    expect(
        Crypto.unseal(
            sealed,
            sealer,
            Crypto.getSealerID(sender),
            nOnceMaterial,
        ),
    ).toEqual(data);
    expect(() =>
        Crypto.unseal(
            sealed,
            wrongSealer,
            Crypto.getSealerID(sender),
            nOnceMaterial,
        ),
    ).toThrow(/Wrong tag/);

    // trying with wrong sealer secret, by hand
    const nOnce = blake3(
        new TextEncoder().encode(stableStringify(nOnceMaterial)),
    ).slice(0, 24);
    const sealer3priv = base58.decode(
        wrongSealer.substring("sealerSecret_z".length),
    );
    const senderPub = base58.decode(
        Crypto.getSealerID(sender).substring("sealer_z".length),
    );
    const sealedBytes = base64url.decode(sealed.substring("sealed_U".length));
    const sharedSecret = x25519.getSharedSecret(sealer3priv, senderPub);

    expect(() => {
        const _ = xsalsa20_poly1305(sharedSecret, nOnce).decrypt(sealedBytes);
    }).toThrow("Wrong tag");
});

test("Hashing is deterministic", () => {
    expect(Crypto.secureHash({ b: "world", a: "hello" })).toEqual(
        Crypto.secureHash({ a: "hello", b: "world" }),
    );

    expect(Crypto.shortHash({ b: "world", a: "hello" })).toEqual(
        Crypto.shortHash({ a: "hello", b: "world" }),
    );
});

test("Encryption for transactions round-trips", () => {
    const { secret } = Crypto.newRandomKeySecret();

    const encrypted1 = Crypto.encryptForTransaction({ a: "hello" }, secret, {
        in: "co_zTEST",
        tx: { sessionID: "co_zTEST_session_zTEST" as SessionID, txIndex: 0 },
    });

    const encrypted2 = Crypto.encryptForTransaction({ b: "world" }, secret, {
        in: "co_zTEST",
        tx: { sessionID: "co_zTEST_session_zTEST" as SessionID, txIndex: 1 },
    });

    const decrypted1 = Crypto.decryptForTransaction(encrypted1, secret, {
        in: "co_zTEST",
        tx: { sessionID: "co_zTEST_session_zTEST" as SessionID, txIndex: 0 },
    });

    const decrypted2 = Crypto.decryptForTransaction(encrypted2, secret, {
        in: "co_zTEST",
        tx: { sessionID: "co_zTEST_session_zTEST" as SessionID, txIndex: 1 },
    });

    expect([decrypted1, decrypted2]).toEqual([{ a: "hello" }, { b: "world" }]);
});

test("Encryption for transactions doesn't decrypt with a wrong key", () => {
    const { secret } = Crypto.newRandomKeySecret();
    const { secret: secret2 } = Crypto.newRandomKeySecret();

    const encrypted1 = Crypto.encryptForTransaction({ a: "hello" }, secret, {
        in: "co_zTEST",
        tx: { sessionID: "co_zTEST_session_zTEST" as SessionID, txIndex: 0 },
    });

    const encrypted2 = Crypto.encryptForTransaction({ b: "world" }, secret, {
        in: "co_zTEST",
        tx: { sessionID: "co_zTEST_session_zTEST" as SessionID, txIndex: 1 },
    });

    const decrypted1 = Crypto.decryptForTransaction(encrypted1, secret2, {
        in: "co_zTEST",
        tx: { sessionID: "co_zTEST_session_zTEST" as SessionID, txIndex: 0 },
    });

    const decrypted2 = Crypto.decryptForTransaction(encrypted2, secret2, {
        in: "co_zTEST",
        tx: { sessionID: "co_zTEST_session_zTEST" as SessionID, txIndex: 1 },
    });

    expect([decrypted1, decrypted2]).toEqual([undefined, undefined]);
});

test("Encryption of keySecrets round-trips", () => {
    const toEncrypt = Crypto.newRandomKeySecret();
    const encrypting = Crypto.newRandomKeySecret();

    const keys = {
        toEncrypt,
        encrypting,
    };

    const encrypted = Crypto.encryptKeySecret(keys);

    const decrypted = Crypto.decryptKeySecret(encrypted, encrypting.secret);

    expect(decrypted).toEqual(toEncrypt.secret);
});

test("Encryption of keySecrets doesn't decrypt with a wrong key", () => {
    const toEncrypt = Crypto.newRandomKeySecret();
    const encrypting = Crypto.newRandomKeySecret();
    const encryptingWrong = Crypto.newRandomKeySecret();

    const keys = {
        toEncrypt,
        encrypting,
    };

    const encrypted = Crypto.encryptKeySecret(keys);

    const decrypted = Crypto.decryptKeySecret(
        encrypted,
        encryptingWrong.secret,
    );

    expect(decrypted).toBeUndefined();
});
