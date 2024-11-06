import { base58 } from "@scure/base";
import { RawAccountID } from "../coValues/account.js";
import { AgentID, RawCoID, TransactionID } from "../ids.js";
import { SessionID } from "../ids.js";
import { Stringified, parseJSON, stableStringify } from "../jsonStringify.js";
import { JsonValue } from "../jsonValue.js";

export type SignerSecret = `signerSecret_z${string}`;
export type SignerID = `signer_z${string}`;
export type Signature = `signature_z${string}`;

export type SealerSecret = `sealerSecret_z${string}`;
export type SealerID = `sealer_z${string}`;
export type Sealed<T> = `sealed_U${string}` & { __type: T };

export type AgentSecret = `${SealerSecret}/${SignerSecret}`;

export const textEncoder = new TextEncoder();
export const textDecoder = new TextDecoder();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class CryptoProvider<Blake3State = any> {
  abstract randomBytes(length: number): Uint8Array;

  abstract newEd25519SigningKey(): Uint8Array;

  newRandomSigner(): SignerSecret {
    return `signerSecret_z${base58.encode(this.newEd25519SigningKey())}`;
  }

  signerSecretToBytes(secret: SignerSecret): Uint8Array {
    return base58.decode(secret.substring("signerSecret_z".length));
  }

  signerSecretFromBytes(bytes: Uint8Array): SignerSecret {
    return `signerSecret_z${base58.encode(bytes)}`;
  }

  abstract getSignerID(secret: SignerSecret): SignerID;

  abstract sign(secret: SignerSecret, message: JsonValue): Signature;

  abstract verify(
    signature: Signature,
    message: JsonValue,
    id: SignerID,
  ): boolean;

  abstract newX25519StaticSecret(): Uint8Array;

  newRandomSealer(): SealerSecret {
    return `sealerSecret_z${base58.encode(this.newX25519StaticSecret())}`;
  }

  sealerSecretToBytes(secret: SealerSecret): Uint8Array {
    return base58.decode(secret.substring("sealerSecret_z".length));
  }

  sealerSecretFromBytes(bytes: Uint8Array): SealerSecret {
    return `sealerSecret_z${base58.encode(bytes)}`;
  }

  abstract getSealerID(secret: SealerSecret): SealerID;

  newRandomAgentSecret(): AgentSecret {
    return `${this.newRandomSealer()}/${this.newRandomSigner()}`;
  }

  agentSecretToBytes(secret: AgentSecret): Uint8Array {
    const [sealerSecret, signerSecret] = secret.split("/");
    return new Uint8Array([
      ...this.sealerSecretToBytes(sealerSecret as SealerSecret),
      ...this.signerSecretToBytes(signerSecret as SignerSecret),
    ]);
  }

  agentSecretFromBytes(bytes: Uint8Array): AgentSecret {
    const sealerSecret = this.sealerSecretFromBytes(bytes.slice(0, 32));
    const signerSecret = this.signerSecretFromBytes(bytes.slice(32));
    return `${sealerSecret}/${signerSecret}`;
  }

  getAgentID(secret: AgentSecret): AgentID {
    const [sealerSecret, signerSecret] = secret.split("/");
    return `${this.getSealerID(
      sealerSecret as SealerSecret,
    )}/${this.getSignerID(signerSecret as SignerSecret)}`;
  }

  getAgentSignerID(agentId: AgentID): SignerID {
    return agentId.split("/")[1] as SignerID;
  }

  getAgentSignerSecret(agentSecret: AgentSecret): SignerSecret {
    return agentSecret.split("/")[1] as SignerSecret;
  }

  getAgentSealerID(agentId: AgentID): SealerID {
    return agentId.split("/")[0] as SealerID;
  }

  getAgentSealerSecret(agentSecret: AgentSecret): SealerSecret {
    return agentSecret.split("/")[0] as SealerSecret;
  }

  abstract emptyBlake3State(): Blake3State;
  abstract cloneBlake3State(state: Blake3State): Blake3State;
  abstract blake3HashOnce(data: Uint8Array): Uint8Array;
  abstract blake3HashOnceWithContext(
    data: Uint8Array,
    { context }: { context: Uint8Array },
  ): Uint8Array;
  abstract blake3IncrementalUpdate(
    state: Blake3State,
    data: Uint8Array,
  ): Blake3State;
  abstract blake3DigestForState(state: Blake3State): Uint8Array;

  secureHash(value: JsonValue): Hash {
    return `hash_z${base58.encode(
      this.blake3HashOnce(textEncoder.encode(stableStringify(value))),
    )}`;
  }

  shortHash(value: JsonValue): ShortHash {
    return `shortHash_z${base58.encode(
      this.blake3HashOnce(textEncoder.encode(stableStringify(value))).slice(
        0,
        shortHashLength,
      ),
    )}`;
  }

  abstract encrypt<T extends JsonValue, N extends JsonValue>(
    value: T,
    keySecret: KeySecret,
    nOnceMaterial: N,
  ): Encrypted<T, N>;

  encryptForTransaction<T extends JsonValue>(
    value: T,
    keySecret: KeySecret,
    nOnceMaterial: { in: RawCoID; tx: TransactionID },
  ): Encrypted<T, { in: RawCoID; tx: TransactionID }> {
    return this.encrypt(value, keySecret, nOnceMaterial);
  }

  abstract decryptRaw<T extends JsonValue, N extends JsonValue>(
    encrypted: Encrypted<T, N>,
    keySecret: KeySecret,
    nOnceMaterial: N,
  ): Stringified<T>;

  decrypt<T extends JsonValue, N extends JsonValue>(
    encrypted: Encrypted<T, N>,
    keySecret: KeySecret,
    nOnceMaterial: N,
  ): T | undefined {
    try {
      return parseJSON(this.decryptRaw(encrypted, keySecret, nOnceMaterial));
    } catch (e) {
      console.error("Decryption error", e);
      return undefined;
    }
  }

  newRandomKeySecret(): { secret: KeySecret; id: KeyID } {
    return {
      secret: `keySecret_z${base58.encode(this.randomBytes(32))}`,
      id: `key_z${base58.encode(this.randomBytes(12))}`,
    };
  }

  decryptRawForTransaction<T extends JsonValue>(
    encrypted: Encrypted<T, { in: RawCoID; tx: TransactionID }>,
    keySecret: KeySecret,
    nOnceMaterial: { in: RawCoID; tx: TransactionID },
  ): Stringified<T> | undefined {
    return this.decryptRaw(encrypted, keySecret, nOnceMaterial);
  }

  decryptForTransaction<T extends JsonValue>(
    encrypted: Encrypted<T, { in: RawCoID; tx: TransactionID }>,
    keySecret: KeySecret,
    nOnceMaterial: { in: RawCoID; tx: TransactionID },
  ): T | undefined {
    return this.decrypt(encrypted, keySecret, nOnceMaterial);
  }

  encryptKeySecret(keys: {
    toEncrypt: { id: KeyID; secret: KeySecret };
    encrypting: { id: KeyID; secret: KeySecret };
  }): {
    encryptedID: KeyID;
    encryptingID: KeyID;
    encrypted: Encrypted<
      KeySecret,
      { encryptedID: KeyID; encryptingID: KeyID }
    >;
  } {
    const nOnceMaterial = {
      encryptedID: keys.toEncrypt.id,
      encryptingID: keys.encrypting.id,
    };

    return {
      encryptedID: keys.toEncrypt.id,
      encryptingID: keys.encrypting.id,
      encrypted: this.encrypt(
        keys.toEncrypt.secret,
        keys.encrypting.secret,
        nOnceMaterial,
      ),
    };
  }

  decryptKeySecret(
    encryptedInfo: {
      encryptedID: KeyID;
      encryptingID: KeyID;
      encrypted: Encrypted<
        KeySecret,
        { encryptedID: KeyID; encryptingID: KeyID }
      >;
    },
    sealingSecret: KeySecret,
  ): KeySecret | undefined {
    const nOnceMaterial = {
      encryptedID: encryptedInfo.encryptedID,
      encryptingID: encryptedInfo.encryptingID,
    };

    return this.decrypt(encryptedInfo.encrypted, sealingSecret, nOnceMaterial);
  }

  abstract seal<T extends JsonValue>({
    message,
    from,
    to,
    nOnceMaterial,
  }: {
    message: T;
    from: SealerSecret;
    to: SealerID;
    nOnceMaterial: { in: RawCoID; tx: TransactionID };
  }): Sealed<T>;

  abstract unseal<T extends JsonValue>(
    sealed: Sealed<T>,
    sealer: SealerSecret,
    from: SealerID,
    nOnceMaterial: { in: RawCoID; tx: TransactionID },
  ): T | undefined;

  uniquenessForHeader(): `z${string}` {
    return `z${base58.encode(this.randomBytes(12))}`;
  }

  createdNowUnique(): {
    createdAt: `2${string}`;
    uniqueness: `z${string}`;
  } {
    const createdAt = new Date().toISOString() as `2${string}`;
    return {
      createdAt,
      uniqueness: this.uniquenessForHeader(),
    };
  }

  newRandomSecretSeed(): Uint8Array {
    return this.randomBytes(secretSeedLength);
  }

  agentSecretFromSecretSeed(secretSeed: Uint8Array): AgentSecret {
    if (secretSeed.length !== secretSeedLength) {
      throw new Error(`Secret seed needs to be ${secretSeedLength} bytes long`);
    }

    return `sealerSecret_z${base58.encode(
      this.blake3HashOnceWithContext(secretSeed, {
        context: textEncoder.encode("seal"),
      }),
    )}/signerSecret_z${base58.encode(
      this.blake3HashOnceWithContext(secretSeed, {
        context: textEncoder.encode("sign"),
      }),
    )}`;
  }

  newRandomSessionID(accountID: RawAccountID | AgentID): SessionID {
    return `${accountID}_session_z${base58.encode(this.randomBytes(8))}`;
  }
}

export type Hash = `hash_z${string}`;

export class StreamingHash {
  state: Uint8Array;
  crypto: CryptoProvider;

  constructor(crypto: CryptoProvider, fromClone?: Uint8Array) {
    this.state = fromClone || crypto.emptyBlake3State();
    this.crypto = crypto;
  }

  update(value: JsonValue): Uint8Array {
    const encoded = textEncoder.encode(stableStringify(value));
    // const before = performance.now();
    this.state = this.crypto.blake3IncrementalUpdate(this.state, encoded);
    // const after = performance.now();
    // console.log(`Hashing throughput in MB/s`, 1000 * (encoded.length / (after - before)) / (1024 * 1024));
    return encoded;
  }

  digest(): Hash {
    const hash = this.crypto.blake3DigestForState(this.state);
    return `hash_z${base58.encode(hash)}`;
  }

  clone(): StreamingHash {
    return new StreamingHash(
      this.crypto,
      this.crypto.cloneBlake3State(this.state),
    );
  }
}

export type ShortHash = `shortHash_z${string}`;
export const shortHashLength = 19;

export type Encrypted<
  T extends JsonValue,
  N extends JsonValue,
> = `encrypted_U${string}` & { __type: T; __nOnceMaterial: N };

export type KeySecret = `keySecret_z${string}`;
export type KeyID = `key_z${string}`;

export const secretSeedLength = 32;
