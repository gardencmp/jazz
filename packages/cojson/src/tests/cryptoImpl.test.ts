import { describe, expect, test } from "vitest";
import { PureJSCrypto } from "../crypto/PureJSCrypto.js";
import { WasmCrypto } from "../crypto/WasmCrypto.js";
import { KeySecret, StreamingHash } from "../crypto/crypto.js";
import { SessionID } from "../ids.js";

describe.each([
  { impl: await WasmCrypto.create(), name: "Wasm" },
  { impl: await PureJSCrypto.create(), name: "PureJS" },
])("Crypto $name", ({ impl }) => {
  test("randomBytes", () => {
    expect(impl.randomBytes(32).length).toEqual(32);
  });

  test("blake3HashOnce", () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const hash = impl.blake3HashOnce(data);
    // prettier-ignore
    expect(hash).toEqual(
      new Uint8Array([
        2, 79, 103, 192, 66, 90, 61, 192, 47, 186, 245, 140, 185, 61, 229, 19,
        46, 61, 117, 197, 25, 250, 160, 186, 218, 33, 73, 29, 136, 201, 112, 87,
      ]),
    );
  });

  test("blake3HashOnceWithContext", () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const context = new Uint8Array([6, 7, 8, 9, 10]);
    const hash = impl.blake3HashOnceWithContext(data, { context });
    // prettier-ignore
    expect(hash).toEqual(
      new Uint8Array([
        26, 197, 20, 5, 159, 115, 36, 109, 188, 32, 237, 183, 252, 248, 89, 48,
        212, 51, 102, 180, 94, 56, 201, 33, 196, 52, 222, 121, 103, 112, 153,
        98,
      ]),
    );
  });

  test("incrementalBlake3", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state = impl.emptyBlake3State() as any;
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state2 = impl.blake3IncrementalUpdate(state, data) as any;
    expect(impl.blake3DigestForState(state2)).toEqual(
      // prettier-ignore
      new Uint8Array([
        2, 79, 103, 192, 66, 90, 61, 192, 47, 186, 245, 140, 185, 61, 229, 19,
        46, 61, 117, 197, 25, 250, 160, 186, 218, 33, 73, 29, 136, 201, 112, 87,
      ]),
    );
    const data2 = new Uint8Array([6, 7, 8, 9, 10]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state3 = impl.blake3IncrementalUpdate(state2, data2) as any;
    expect(impl.blake3DigestForState(state3)).toEqual(
      // prettier-ignore
      new Uint8Array([
        165, 131, 141, 69, 2, 69, 39, 236, 196, 244, 180, 213, 147, 124, 222,
        39, 68, 223, 54, 176, 242, 97, 200, 101, 204, 79, 21, 233, 56, 51, 1,
        199,
      ]),
    );
  });

  test("newEd25519SigningKey", () => {
    expect(impl.newEd25519SigningKey().length).toEqual(32);
  });

  test("getSignerID", () => {
    const secret = impl.signerSecretFromBytes(
      new Uint8Array(Array.from({ length: 32 }, (_, i) => i * 2)),
    );
    const id = impl.getSignerID(secret);
    expect(id).toEqual("signer_z8wDhwtSA2twZvmz8J3Df63TdCBxC7ta9hFASV9cZC9xw");
  });

  test("sign and verify", () => {
    const secret = impl.signerSecretFromBytes(
      new Uint8Array(Array.from({ length: 32 }, (_, i) => i * 2)),
    );
    const wrongSecret = impl.signerSecretFromBytes(
      new Uint8Array(
        Array.from({ length: 32 }, (_, i) => (i === 0 ? 1 : i * 2)),
      ),
    );
    const message = { foo: "bar" };
    const wrongMessage = { foo: "baz" };
    const signature = impl.sign(secret, message);
    const wrongSignature = impl.sign(wrongSecret, message);
    expect(signature).toEqual(
      "signature_zHH7trJJ4iJFgYv9B8QtF96qcG7PbPJcfojy9ACtJc6z9FqzbJNM6xeqVLxCEK1oSj1oSYAgy2V3CW5SzjYDh8ax",
    );
    expect(
      impl.verify(signature, message, impl.getSignerID(secret)),
    ).toBeTruthy();
    expect(
      impl.verify(wrongSignature, message, impl.getSignerID(secret)),
    ).toBeFalsy();
    expect(
      impl.verify(signature, wrongMessage, impl.getSignerID(secret)),
    ).toBeFalsy();
  });

  test("newX25519StaticSecret", () => {
    expect(impl.newX25519StaticSecret().length).toEqual(32);
  });

  test("getSealerID", () => {
    const secret = impl.sealerSecretFromBytes(
      new Uint8Array(Array.from({ length: 32 }, (_, i) => i * 2)),
    );
    const id = impl.getSealerID(secret);
    expect(id).toEqual("sealer_zBvzQipsgJZwgy4rN5dfnWQWQNrV4PnJpWfDjZkJ5iYqy");
  });

  test("encrypt and decrypt", () => {
    const secret: KeySecret =
      "keySecret_zyRhQCZGM3LwEjB2nXTktyBQ56JiDBHbRtYjjddiugjT";
    const data = { foo: "bar" };
    const nOnceMaterial = { bar: "foo" };
    const encrypted = impl.encrypt(data, secret, nOnceMaterial);
    expect(encrypted).toEqual("encrypted_UDrVbWTATlj-ECtLqJQ==");
    const decrypted = impl.decrypt(encrypted, secret, nOnceMaterial);
    expect(decrypted).toEqual(data);
    const wrongSecret =
      "keySecret_zyRhQCZGM3LwEjB2nXTktyBQ56JiDBHbRtYjjddingjT";
    expect(impl.decrypt(encrypted, wrongSecret, nOnceMaterial)).toBeUndefined();
    const wrongNOnceMaterial = { bar: "baz" };
    expect(impl.decrypt(encrypted, secret, wrongNOnceMaterial)).toBeUndefined();
  });

  test("seal and unseal", () => {
    const senderSecret =
      "sealerSecret_zFffKAY7Ln5ouAbmC6K21N6uPs1RQXyhpcuQzK3kPWhhg";
    const recipientSecret =
      "sealerSecret_z3K6m9AHmEJeTrCQW4zY5vicneorj9sVQasA7E8FYvDQa";
    const message = { foo: "bar" };
    const nOnceMaterial = {
      in: "co_zSomeCoValue" as const,
      tx: {
        sessionID: "co_zSomeAccount_session_zSomeSession" as SessionID,
        txIndex: 42,
      },
    };

    const sealed = impl.seal({
      message,
      from: senderSecret,
      to: impl.getSealerID(recipientSecret),
      nOnceMaterial,
    });

    expect(sealed).toEqual("sealed_UtuddAQjop6zMR47aI7HOqj-f0kR2tdFvRxzDe4I=");

    const unsealed = impl.unseal(
      sealed,
      recipientSecret,
      impl.getSealerID(senderSecret),
      nOnceMaterial,
    );
    expect(unsealed).toEqual(message);

    const wrongRecipientSecret =
      "sealerSecret_zHV1Y1VPbc31B8bi7yw4oL5CPPnPFspKwUjkFErgJFuoB";
    expect(() =>
      impl.unseal(
        sealed,
        wrongRecipientSecret,
        impl.getSealerID(senderSecret),
        nOnceMaterial,
      ),
    ).toThrow();
    const wrongNOnceMaterial = {
      in: "co_zSomeCoValue" as const,
      tx: {
        sessionID: "co_zSomeAccount_session_zSomeSession" as SessionID,
        txIndex: 43,
      },
    };
    expect(() =>
      impl.unseal(
        sealed,
        recipientSecret,
        impl.getSealerID(senderSecret),
        wrongNOnceMaterial,
      ),
    ).toThrow();
  });

  test("StreamingHash clone", () => {
    const originalHash = new StreamingHash(impl);
    originalHash.update({ foo: "bar" });

    const clonedHash = originalHash.clone();

    // Update the original hash
    originalHash.update({ baz: "qux" });

    // Update the cloned hash differently
    clonedHash.update({ quux: "corge" });

    // The digests should be different
    expect(originalHash.digest()).not.toEqual(clonedHash.digest());

    // The cloned hash should match a new hash with the same updates
    const newHash = new StreamingHash(impl);
    newHash.update({ foo: "bar" });
    newHash.update({ quux: "corge" });
    expect(clonedHash.digest()).toEqual(newHash.digest());
  });
});
