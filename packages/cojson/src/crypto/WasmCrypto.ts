import {
  Ed25519Signature,
  Ed25519SigningKey,
  Ed25519VerifyingKey,
  Memory,
  X25519PublicKey,
  X25519StaticSecret,
  initBundledOnce,
} from "@hazae41/berith";
import { xsalsa20, xsalsa20_poly1305 } from "@noble/ciphers/salsa";
import { randomBytes } from "@noble/ciphers/webcrypto/utils";
import { base58 } from "@scure/base";
import { createBLAKE3 } from "hash-wasm";
import { base64URLtoBytes, bytesToBase64url } from "../base64url.js";
import { RawCoID, TransactionID } from "../ids.js";
import { Stringified, stableStringify } from "../jsonStringify.js";
import { JsonValue } from "../jsonValue.js";
import {
  CryptoProvider,
  Encrypted,
  KeySecret,
  Sealed,
  SealerID,
  SealerSecret,
  Signature,
  SignerID,
  SignerSecret,
  textDecoder,
  textEncoder,
} from "./crypto.js";

export class WasmCrypto extends CryptoProvider<Uint8Array> {
  private constructor(
    public blake3Instance: Awaited<ReturnType<typeof createBLAKE3>>,
  ) {
    super();
  }

  static async create(): Promise<WasmCrypto> {
    return Promise.all([
      createBLAKE3(),
      initBundledOnce(),
      new Promise<void>((resolve) => {
        if ("crypto" in globalThis) {
          resolve();
        } else {
          return import(/*webpackIgnore: true*/ "node:crypto").then(
            ({ webcrypto }) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (globalThis as any).crypto = webcrypto;
              resolve();
            },
          );
        }
      }),
    ]).then(([blake3instance]) => new WasmCrypto(blake3instance));
  }

  randomBytes(length: number): Uint8Array {
    return randomBytes(length);
  }

  emptyBlake3State(): Uint8Array {
    return this.blake3Instance.init().save();
  }

  cloneBlake3State(state: Uint8Array): Uint8Array {
    return this.blake3Instance.load(state).save();
  }

  blake3HashOnce(data: Uint8Array) {
    return this.blake3Instance.init().update(data).digest("binary");
  }

  blake3HashOnceWithContext(
    data: Uint8Array,
    { context }: { context: Uint8Array },
  ) {
    return this.blake3Instance
      .init()
      .update(context)
      .update(data)
      .digest("binary");
  }

  blake3IncrementalUpdate(state: Uint8Array, data: Uint8Array): Uint8Array {
    return this.blake3Instance.load(state).update(data).save();
  }

  blake3DigestForState(state: Uint8Array): Uint8Array {
    return this.blake3Instance.load(state).digest("binary");
  }

  newEd25519SigningKey(): Uint8Array {
    return new Ed25519SigningKey().to_bytes().copyAndDispose();
  }

  getSignerID(secret: SignerSecret): SignerID {
    return `signer_z${base58.encode(
      Ed25519SigningKey.from_bytes(
        new Memory(base58.decode(secret.substring("signerSecret_z".length))),
      )
        .public()
        .to_bytes()
        .copyAndDispose(),
    )}`;
  }

  sign(secret: SignerSecret, message: JsonValue): Signature {
    const signature = Ed25519SigningKey.from_bytes(
      new Memory(base58.decode(secret.substring("signerSecret_z".length))),
    )
      .sign(new Memory(textEncoder.encode(stableStringify(message))))
      .to_bytes()
      .copyAndDispose();
    return `signature_z${base58.encode(signature)}`;
  }

  verify(signature: Signature, message: JsonValue, id: SignerID): boolean {
    return new Ed25519VerifyingKey(
      new Memory(base58.decode(id.substring("signer_z".length))),
    ).verify(
      new Memory(textEncoder.encode(stableStringify(message))),
      new Ed25519Signature(
        new Memory(base58.decode(signature.substring("signature_z".length))),
      ),
    );
  }

  newX25519StaticSecret(): Uint8Array {
    return new X25519StaticSecret().to_bytes().copyAndDispose();
  }

  getSealerID(secret: SealerSecret): SealerID {
    return `sealer_z${base58.encode(
      X25519StaticSecret.from_bytes(
        new Memory(base58.decode(secret.substring("sealerSecret_z".length))),
      )
        .to_public()
        .to_bytes()
        .copyAndDispose(),
    )}`;
  }

  encrypt<T extends JsonValue, N extends JsonValue>(
    value: T,
    keySecret: KeySecret,
    nOnceMaterial: N,
  ): Encrypted<T, N> {
    const keySecretBytes = base58.decode(
      keySecret.substring("keySecret_z".length),
    );
    const nOnce = this.blake3HashOnce(
      textEncoder.encode(stableStringify(nOnceMaterial)),
    ).slice(0, 24);

    const plaintext = textEncoder.encode(stableStringify(value));
    const ciphertext = xsalsa20(keySecretBytes, nOnce, plaintext);
    return `encrypted_U${bytesToBase64url(ciphertext)}` as Encrypted<T, N>;
  }

  decryptRaw<T extends JsonValue, N extends JsonValue>(
    encrypted: Encrypted<T, N>,
    keySecret: KeySecret,
    nOnceMaterial: N,
  ): Stringified<T> {
    const keySecretBytes = base58.decode(
      keySecret.substring("keySecret_z".length),
    );
    const nOnce = this.blake3HashOnce(
      textEncoder.encode(stableStringify(nOnceMaterial)),
    ).slice(0, 24);

    const ciphertext = base64URLtoBytes(
      encrypted.substring("encrypted_U".length),
    );
    const plaintext = xsalsa20(keySecretBytes, nOnce, ciphertext);

    return textDecoder.decode(plaintext) as Stringified<T>;
  }

  seal<T extends JsonValue>({
    message,
    from,
    to,
    nOnceMaterial,
  }: {
    message: T;
    from: SealerSecret;
    to: SealerID;
    nOnceMaterial: { in: RawCoID; tx: TransactionID };
  }): Sealed<T> {
    const nOnce = this.blake3HashOnce(
      textEncoder.encode(stableStringify(nOnceMaterial)),
    ).slice(0, 24);

    const sealerPub = base58.decode(to.substring("sealer_z".length));

    const senderPriv = base58.decode(from.substring("sealerSecret_z".length));

    const plaintext = textEncoder.encode(stableStringify(message));

    const sharedSecret = X25519StaticSecret.from_bytes(new Memory(senderPriv))
      .diffie_hellman(X25519PublicKey.from_bytes(new Memory(sealerPub)))
      .to_bytes()
      .copyAndDispose();

    const sealedBytes = xsalsa20_poly1305(sharedSecret, nOnce).encrypt(
      plaintext,
    );

    return `sealed_U${bytesToBase64url(sealedBytes)}` as Sealed<T>;
  }

  unseal<T extends JsonValue>(
    sealed: Sealed<T>,
    sealer: SealerSecret,
    from: SealerID,
    nOnceMaterial: { in: RawCoID; tx: TransactionID },
  ): T | undefined {
    const nOnce = this.blake3HashOnce(
      textEncoder.encode(stableStringify(nOnceMaterial)),
    ).slice(0, 24);

    const sealerPriv = base58.decode(sealer.substring("sealerSecret_z".length));

    const senderPub = base58.decode(from.substring("sealer_z".length));

    const sealedBytes = base64URLtoBytes(sealed.substring("sealed_U".length));

    const sharedSecret = X25519StaticSecret.from_bytes(new Memory(sealerPriv))
      .diffie_hellman(X25519PublicKey.from_bytes(new Memory(senderPub)))
      .to_bytes()
      .copyAndDispose();

    const plaintext = xsalsa20_poly1305(sharedSecret, nOnce).decrypt(
      sealedBytes,
    );

    try {
      return JSON.parse(textDecoder.decode(plaintext));
    } catch (e) {
      console.error("Failed to decrypt/parse sealed message", e);
      return undefined;
    }
  }
}
