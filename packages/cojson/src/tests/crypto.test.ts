import { xsalsa20_poly1305 } from "@noble/ciphers/salsa";
import { x25519 } from "@noble/curves/ed25519";
import { blake3 } from "@noble/hashes/blake3";
import { base58, base64url } from "@scure/base";
import { expect, test } from "vitest";
import { PureJSCrypto } from "../crypto/PureJSCrypto.js";
import { WasmCrypto } from "../crypto/WasmCrypto.js";
import { SessionID } from "../ids.js";
import { stableStringify } from "../jsonStringify.js";

const wasmCrypto = await WasmCrypto.create();
const pureJSCrypto = await PureJSCrypto.create();

[wasmCrypto, pureJSCrypto].forEach((crypto) => {
  const name = crypto.constructor.name;

  test(`Signatures round-trip and use stable stringify [${name}]`, () => {
    const data = { b: "world", a: "hello" };
    const signer = crypto.newRandomSigner();
    const signature = crypto.sign(signer, data);

    expect(signature).toMatch(/^signature_z/);
    expect(
      crypto.verify(
        signature,
        { a: "hello", b: "world" },
        crypto.getSignerID(signer),
      ),
    ).toBe(true);
  });

  test(`Invalid signatures don't verify [${name}]`, () => {
    const data = { b: "world", a: "hello" };
    const signer = crypto.newRandomSigner();
    const signer2 = crypto.newRandomSigner();
    const wrongSignature = crypto.sign(signer2, data);

    expect(
      crypto.verify(wrongSignature, data, crypto.getSignerID(signer)),
    ).toBe(false);
  });

  test(`encrypting round-trips, but invalid receiver can't unseal [${name}]`, () => {
    const data = { b: "world", a: "hello" };
    const sender = crypto.newRandomSealer();
    const sealer = crypto.newRandomSealer();
    const wrongSealer = crypto.newRandomSealer();

    const nOnceMaterial = {
      in: "co_zTEST",
      tx: { sessionID: "co_zTEST_session_zTEST" as SessionID, txIndex: 0 },
    } as const;

    const sealed = crypto.seal({
      message: data,
      from: sender,
      to: crypto.getSealerID(sealer),
      nOnceMaterial,
    });

    expect(
      crypto.unseal(sealed, sealer, crypto.getSealerID(sender), nOnceMaterial),
    ).toEqual(data);
    expect(() =>
      crypto.unseal(
        sealed,
        wrongSealer,
        crypto.getSealerID(sender),
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
      crypto.getSealerID(sender).substring("sealer_z".length),
    );
    const sealedBytes = base64url.decode(sealed.substring("sealed_U".length));
    const sharedSecret = x25519.getSharedSecret(sealer3priv, senderPub);

    expect(() => {
      const _ = xsalsa20_poly1305(sharedSecret, nOnce).decrypt(sealedBytes);
    }).toThrow("Wrong tag");
  });

  test(`Hashing is deterministic [${name}]`, () => {
    expect(crypto.secureHash({ b: "world", a: "hello" })).toEqual(
      crypto.secureHash({ a: "hello", b: "world" }),
    );

    expect(crypto.shortHash({ b: "world", a: "hello" })).toEqual(
      crypto.shortHash({ a: "hello", b: "world" }),
    );
  });

  test(`Encryption for transactions round-trips [${name}]`, () => {
    const { secret } = crypto.newRandomKeySecret();

    const encrypted1 = crypto.encryptForTransaction({ a: "hello" }, secret, {
      in: "co_zTEST",
      tx: { sessionID: "co_zTEST_session_zTEST" as SessionID, txIndex: 0 },
    });

    const encrypted2 = crypto.encryptForTransaction({ b: "world" }, secret, {
      in: "co_zTEST",
      tx: { sessionID: "co_zTEST_session_zTEST" as SessionID, txIndex: 1 },
    });

    const decrypted1 = crypto.decryptForTransaction(encrypted1, secret, {
      in: "co_zTEST",
      tx: { sessionID: "co_zTEST_session_zTEST" as SessionID, txIndex: 0 },
    });

    const decrypted2 = crypto.decryptForTransaction(encrypted2, secret, {
      in: "co_zTEST",
      tx: { sessionID: "co_zTEST_session_zTEST" as SessionID, txIndex: 1 },
    });

    expect([decrypted1, decrypted2]).toEqual([{ a: "hello" }, { b: "world" }]);
  });

  test(`Encryption for transactions doesn't decrypt with a wrong key [${name}]`, () => {
    const { secret } = crypto.newRandomKeySecret();
    const { secret: secret2 } = crypto.newRandomKeySecret();

    const encrypted1 = crypto.encryptForTransaction({ a: "hello" }, secret, {
      in: "co_zTEST",
      tx: { sessionID: "co_zTEST_session_zTEST" as SessionID, txIndex: 0 },
    });

    const encrypted2 = crypto.encryptForTransaction({ b: "world" }, secret, {
      in: "co_zTEST",
      tx: { sessionID: "co_zTEST_session_zTEST" as SessionID, txIndex: 1 },
    });

    const decrypted1 = crypto.decryptForTransaction(encrypted1, secret2, {
      in: "co_zTEST",
      tx: { sessionID: "co_zTEST_session_zTEST" as SessionID, txIndex: 0 },
    });

    const decrypted2 = crypto.decryptForTransaction(encrypted2, secret2, {
      in: "co_zTEST",
      tx: { sessionID: "co_zTEST_session_zTEST" as SessionID, txIndex: 1 },
    });

    expect([decrypted1, decrypted2]).toEqual([undefined, undefined]);
  });

  test(`Encryption of keySecrets round-trips [${name}]`, () => {
    const toEncrypt = crypto.newRandomKeySecret();
    const encrypting = crypto.newRandomKeySecret();

    const keys = {
      toEncrypt,
      encrypting,
    };

    const encrypted = crypto.encryptKeySecret(keys);

    const decrypted = crypto.decryptKeySecret(encrypted, encrypting.secret);

    expect(decrypted).toEqual(toEncrypt.secret);
  });

  test(`Encryption of keySecrets doesn't decrypt with a wrong key [${name}]`, () => {
    const toEncrypt = crypto.newRandomKeySecret();
    const encrypting = crypto.newRandomKeySecret();
    const encryptingWrong = crypto.newRandomKeySecret();

    const keys = {
      toEncrypt,
      encrypting,
    };

    const encrypted = crypto.encryptKeySecret(keys);

    const decrypted = crypto.decryptKeySecret(
      encrypted,
      encryptingWrong.secret,
    );

    expect(decrypted).toBeUndefined();
  });
});
