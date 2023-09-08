import { ed25519, x25519 } from "@noble/curves/ed25519";
import { xsalsa20_poly1305, xsalsa20 } from "@noble/ciphers/salsa";
import { JsonValue } from "./jsonValue.js";
import { base58 } from "@scure/base";
import { randomBytes } from "@noble/ciphers/webcrypto/utils";
import { AgentID, RawCoID, TransactionID } from "./ids.js";
import { base64URLtoBytes, bytesToBase64url } from "./base64url.js";

import { createBLAKE3 } from 'hash-wasm';
import { stableStringify } from "./fastJsonStableStringify.js";

let blake3Instance: Awaited<ReturnType<typeof createBLAKE3>>;
let blake3HashOnce: (data: Uint8Array) => Uint8Array;
let blake3HashOnceWithContext: (data: Uint8Array, {context}: {context: Uint8Array}) => Uint8Array;
let blake3incrementalUpdateSLOW_WITH_DEVTOOLS: (state: Uint8Array, data: Uint8Array) => Uint8Array;
let blake3digestForState: (state: Uint8Array) => Uint8Array;

export const cryptoReady = new Promise<void>((resolve) => {
    createBLAKE3().then(bl3 => {
        blake3Instance = bl3;
        blake3HashOnce = (data) => {
            return bl3.init().update(data).digest('binary');
        }
        blake3HashOnceWithContext = (data, {context}) => {
            return bl3.init().update(context).update(data).digest('binary');
        }
        blake3incrementalUpdateSLOW_WITH_DEVTOOLS = (state, data) => {
            bl3.load(state).update(data);
            return bl3.save();
        }
        blake3digestForState = (state) => {
            return bl3.load(state).digest('binary');
        }
        resolve();
    })
});

export type SignerSecret = `signerSecret_z${string}`;
export type SignerID = `signer_z${string}`;
export type Signature = `signature_z${string}`;

export type SealerSecret = `sealerSecret_z${string}`;
export type SealerID = `sealer_z${string}`;
export type Sealed<T> = `sealed_U${string}` & { __type: T };

export type AgentSecret = `${SealerSecret}/${SignerSecret}`;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function newRandomSigner(): SignerSecret {
    return `signerSecret_z${base58.encode(ed25519.utils.randomPrivateKey())}`;
}

export function signerSecretToBytes(secret: SignerSecret): Uint8Array {
    return base58.decode(secret.substring("signerSecret_z".length));
}

export function signerSecretFromBytes(bytes: Uint8Array): SignerSecret {
    return `signerSecret_z${base58.encode(bytes)}`;
}

export function getSignerID(secret: SignerSecret): SignerID {
    return `signer_z${base58.encode(
        ed25519.getPublicKey(
            base58.decode(secret.substring("signerSecret_z".length))
        )
    )}`;
}

export function sign(secret: SignerSecret, message: JsonValue): Signature {
    const signature = ed25519.sign(
        textEncoder.encode(stableStringify(message)),
        base58.decode(secret.substring("signerSecret_z".length))
    );
    return `signature_z${base58.encode(signature)}`;
}

export function verify(
    signature: Signature,
    message: JsonValue,
    id: SignerID
): boolean {
    return ed25519.verify(
        base58.decode(signature.substring("signature_z".length)),
        textEncoder.encode(stableStringify(message)),
        base58.decode(id.substring("signer_z".length))
    );
}

export function newRandomSealer(): SealerSecret {
    return `sealerSecret_z${base58.encode(x25519.utils.randomPrivateKey())}`;
}

export function sealerSecretToBytes(secret: SealerSecret): Uint8Array {
    return base58.decode(secret.substring("sealerSecret_z".length));
}

export function sealerSecretFromBytes(bytes: Uint8Array): SealerSecret {
    return `sealerSecret_z${base58.encode(bytes)}`;
}

export function getSealerID(secret: SealerSecret): SealerID {
    return `sealer_z${base58.encode(
        x25519.getPublicKey(
            base58.decode(secret.substring("sealerSecret_z".length))
        )
    )}`;
}

export function newRandomAgentSecret(): AgentSecret {
    return `${newRandomSealer()}/${newRandomSigner()}`;
}

export function agentSecretToBytes(secret: AgentSecret): Uint8Array {
    const [sealerSecret, signerSecret] = secret.split("/");
    return new Uint8Array([
        ...sealerSecretToBytes(sealerSecret as SealerSecret),
        ...signerSecretToBytes(signerSecret as SignerSecret),
    ]);
}

export function agentSecretFromBytes(bytes: Uint8Array): AgentSecret {
    const sealerSecret = sealerSecretFromBytes(bytes.slice(0, 32));
    const signerSecret = signerSecretFromBytes(bytes.slice(32));
    return `${sealerSecret}/${signerSecret}`;
}

export function getAgentID(secret: AgentSecret): AgentID {
    const [sealerSecret, signerSecret] = secret.split("/");
    return `${getSealerID(sealerSecret as SealerSecret)}/${getSignerID(
        signerSecret as SignerSecret
    )}`;
}

export function getAgentSignerID(agentId: AgentID): SignerID {
    return agentId.split("/")[1] as SignerID;
}

export function getAgentSignerSecret(agentSecret: AgentSecret): SignerSecret {
    return agentSecret.split("/")[1] as SignerSecret;
}

export function getAgentSealerID(agentId: AgentID): SealerID {
    return agentId.split("/")[0] as SealerID;
}

export function getAgentSealerSecret(agentSecret: AgentSecret): SealerSecret {
    return agentSecret.split("/")[0] as SealerSecret;
}

export function seal<T extends JsonValue>(
    message: T,
    from: SealerSecret,
    to: SealerID,
    nOnceMaterial: { in: RawCoID; tx: TransactionID }
): Sealed<T> {
    const nOnce = blake3HashOnce(
        textEncoder.encode(stableStringify(nOnceMaterial))
    ).slice(0, 24);

    const sealerPub = base58.decode(to.substring("sealer_z".length));

    const senderPriv = base58.decode(from.substring("sealerSecret_z".length));

    const plaintext = textEncoder.encode(stableStringify(message));

    const sharedSecret = x25519.getSharedSecret(senderPriv, sealerPub);

    const sealedBytes = xsalsa20_poly1305(sharedSecret, nOnce).encrypt(
        plaintext
    );

    return `sealed_U${bytesToBase64url(sealedBytes)}` as Sealed<T>;
}

export function unseal<T extends JsonValue>(
    sealed: Sealed<T>,
    sealer: SealerSecret,
    from: SealerID,
    nOnceMaterial: { in: RawCoID; tx: TransactionID }
): T | undefined {
    const nOnce = blake3HashOnce(
        textEncoder.encode(stableStringify(nOnceMaterial))
    ).slice(0, 24);

    const sealerPriv = base58.decode(sealer.substring("sealerSecret_z".length));

    const senderPub = base58.decode(from.substring("sealer_z".length));

    const sealedBytes = base64URLtoBytes(sealed.substring("sealed_U".length));

    const sharedSecret = x25519.getSharedSecret(sealerPriv, senderPub);

    const plaintext = xsalsa20_poly1305(sharedSecret, nOnce).decrypt(
        sealedBytes
    );

    try {
        return JSON.parse(textDecoder.decode(plaintext));
    } catch (e) {
        console.error("Failed to decrypt/parse sealed message", e);
        return undefined;
    }
}

export type Hash = `hash_z${string}`;

export function secureHash(value: JsonValue): Hash {
    return `hash_z${base58.encode(
        blake3HashOnce(textEncoder.encode(stableStringify(value)))
    )}`;
}

export class StreamingHash {
    state: Uint8Array;

    constructor(fromClone?: Uint8Array) {
        this.state = fromClone || blake3Instance.init().save();
    }

    update(value: JsonValue) {
        const encoded = textEncoder.encode(stableStringify(value))
        // const before = performance.now();
        this.state = blake3incrementalUpdateSLOW_WITH_DEVTOOLS(this.state, encoded);
        // const after = performance.now();
        // console.log(`Hashing throughput in MB/s`, 1000 * (encoded.length / (after - before)) / (1024 * 1024));
    }

    digest(): Hash {
        const hash = blake3digestForState(this.state);
        return `hash_z${base58.encode(hash)}`;
    }

    clone(): StreamingHash {
        return new StreamingHash(new Uint8Array(this.state));
    }
}

export type ShortHash = `shortHash_z${string}`;
export const shortHashLength = 19;

export function shortHash(value: JsonValue): ShortHash {
    return `shortHash_z${base58.encode(
        blake3HashOnce(textEncoder.encode(stableStringify(value))).slice(
            0,
            shortHashLength
        )
    )}`;
}

export type Encrypted<
    T extends JsonValue,
    N extends JsonValue
> = `encrypted_U${string}` & { __type: T; __nOnceMaterial: N };

export type KeySecret = `keySecret_z${string}`;
export type KeyID = `key_z${string}`;

export function newRandomKeySecret(): { secret: KeySecret; id: KeyID } {
    return {
        secret: `keySecret_z${base58.encode(randomBytes(32))}`,
        id: `key_z${base58.encode(randomBytes(12))}`,
    };
}

function encrypt<T extends JsonValue, N extends JsonValue>(
    value: T,
    keySecret: KeySecret,
    nOnceMaterial: N
): Encrypted<T, N> {
    const keySecretBytes = base58.decode(
        keySecret.substring("keySecret_z".length)
    );
    const nOnce = blake3HashOnce(
        textEncoder.encode(stableStringify(nOnceMaterial))
    ).slice(0, 24);

    const plaintext = textEncoder.encode(stableStringify(value));
    const ciphertext = xsalsa20(keySecretBytes, nOnce, plaintext);
    return `encrypted_U${bytesToBase64url(ciphertext)}` as Encrypted<T, N>;
}

export function encryptForTransaction<T extends JsonValue>(
    value: T,
    keySecret: KeySecret,
    nOnceMaterial: { in: RawCoID; tx: TransactionID }
): Encrypted<T, { in: RawCoID; tx: TransactionID }> {
    return encrypt(value, keySecret, nOnceMaterial);
}

export function encryptKeySecret(keys: {
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
        encrypted: encrypt(
            keys.toEncrypt.secret,
            keys.encrypting.secret,
            nOnceMaterial
        ),
    };
}

function decrypt<T extends JsonValue, N extends JsonValue>(
    encrypted: Encrypted<T, N>,
    keySecret: KeySecret,
    nOnceMaterial: N
): T | undefined {
    const keySecretBytes = base58.decode(
        keySecret.substring("keySecret_z".length)
    );
    const nOnce = blake3HashOnce(
        textEncoder.encode(stableStringify(nOnceMaterial))
    ).slice(0, 24);

    const ciphertext = base64URLtoBytes(
        encrypted.substring("encrypted_U".length)
    );
    const plaintext = xsalsa20(keySecretBytes, nOnce, ciphertext);

    try {
        return JSON.parse(textDecoder.decode(plaintext));
    } catch (e) {
        return undefined;
    }
}

export function decryptForTransaction<T extends JsonValue>(
    encrypted: Encrypted<T, { in: RawCoID; tx: TransactionID }>,
    keySecret: KeySecret,
    nOnceMaterial: { in: RawCoID; tx: TransactionID }
): T | undefined {
    return decrypt(encrypted, keySecret, nOnceMaterial);
}

export function decryptKeySecret(
    encryptedInfo: {
        encryptedID: KeyID;
        encryptingID: KeyID;
        encrypted: Encrypted<
            KeySecret,
            { encryptedID: KeyID; encryptingID: KeyID }
        >;
    },
    sealingSecret: KeySecret
): KeySecret | undefined {
    const nOnceMaterial = {
        encryptedID: encryptedInfo.encryptedID,
        encryptingID: encryptedInfo.encryptingID,
    };

    return decrypt(encryptedInfo.encrypted, sealingSecret, nOnceMaterial);
}

export function uniquenessForHeader(): `z${string}` {
    return `z${base58.encode(randomBytes(12))}`;
}

export function createdNowUnique(): {
    createdAt: `2${string}`;
    uniqueness: `z${string}`;
} {
    const createdAt = new Date().toISOString() as `2${string}`;
    return {
        createdAt,
        uniqueness: uniquenessForHeader(),
    };
}

export const secretSeedLength = 32;

export function newRandomSecretSeed(): Uint8Array {
    return randomBytes(secretSeedLength);
}

export function agentSecretFromSecretSeed(secretSeed: Uint8Array): AgentSecret {
    if (secretSeed.length !== secretSeedLength) {
        throw new Error(
            `Secret seed needs to be ${secretSeedLength} bytes long`
        );
    }

    return `sealerSecret_z${base58.encode(
        blake3HashOnceWithContext(secretSeed, {
            context: textEncoder.encode("seal"),
        })
    )}/signerSecret_z${base58.encode(
        blake3HashOnceWithContext(secretSeed, {
            context: textEncoder.encode("sign"),
        })
    )}`;
}
