import { ed25519, x25519 } from "@noble/curves/ed25519";
import { xsalsa20_poly1305, xsalsa20 } from "@noble/ciphers/salsa";
import { JsonValue } from './jsonValue.js';
import { base58, base64url } from "@scure/base";
import stableStringify from "fast-json-stable-stringify";
import { blake3 } from "@noble/hashes/blake3";
import { randomBytes } from "@noble/ciphers/webcrypto/utils";
import { AgentID, RawCoValueID, TransactionID } from './ids.js';

export type SignatorySecret = `signatorySecret_z${string}`;
export type SignatoryID = `signatory_z${string}`;
export type Signature = `signature_z${string}`;

export type RecipientSecret = `recipientSecret_z${string}`;
export type RecipientID = `recipient_z${string}`;
export type Sealed<T> = `sealed_U${string}` & { __type: T };

export type AgentSecret = `${RecipientSecret}/${SignatorySecret}`;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function newRandomSignatory(): SignatorySecret {
    return `signatorySecret_z${base58.encode(
        ed25519.utils.randomPrivateKey()
    )}`;
}

export function signatorySecretToBytes(secret: SignatorySecret): Uint8Array {
    return base58.decode(secret.substring("signatorySecret_z".length));
}

export function signatorySecretFromBytes(bytes: Uint8Array): SignatorySecret {
    return `signatorySecret_z${base58.encode(bytes)}`;
}

export function getSignatoryID(secret: SignatorySecret): SignatoryID {
    return `signatory_z${base58.encode(
        ed25519.getPublicKey(
            base58.decode(secret.substring("signatorySecret_z".length))
        )
    )}`;
}

export function sign(secret: SignatorySecret, message: JsonValue): Signature {
    const signature = ed25519.sign(
        textEncoder.encode(stableStringify(message)),
        base58.decode(secret.substring("signatorySecret_z".length))
    );
    return `signature_z${base58.encode(signature)}`;
}

export function verify(
    signature: Signature,
    message: JsonValue,
    id: SignatoryID
): boolean {
    return ed25519.verify(
        base58.decode(signature.substring("signature_z".length)),
        textEncoder.encode(stableStringify(message)),
        base58.decode(id.substring("signatory_z".length))
    );
}

export function newRandomRecipient(): RecipientSecret {
    return `recipientSecret_z${base58.encode(x25519.utils.randomPrivateKey())}`;
}

export function recipientSecretToBytes(secret: RecipientSecret): Uint8Array {
    return base58.decode(secret.substring("recipientSecret_z".length));
}

export function recipientSecretFromBytes(bytes: Uint8Array): RecipientSecret {
    return `recipientSecret_z${base58.encode(bytes)}`;
}

export function getRecipientID(secret: RecipientSecret): RecipientID {
    return `recipient_z${base58.encode(
        x25519.getPublicKey(
            base58.decode(secret.substring("recipientSecret_z".length))
        )
    )}`;
}

export function newRandomAgentSecret(): AgentSecret {
    return `${newRandomRecipient()}/${newRandomSignatory()}`;
}

export function agentSecretToBytes(secret: AgentSecret): Uint8Array {
    const [recipientSecret, signatorySecret] = secret.split("/");
    return new Uint8Array([
        ...recipientSecretToBytes(recipientSecret as RecipientSecret),
        ...signatorySecretToBytes(signatorySecret as SignatorySecret),
    ]);
}

export function agentSecretFromBytes(bytes: Uint8Array): AgentSecret {
    const recipientSecret = recipientSecretFromBytes(
        bytes.slice(0, 32)
    );
    const signatorySecret = signatorySecretFromBytes(
        bytes.slice(32)
    );
    return `${recipientSecret}/${signatorySecret}`;
}

export function getAgentID(secret: AgentSecret): AgentID {
    const [recipientSecret, signatorySecret] = secret.split("/");
    return `${getRecipientID(
        recipientSecret as RecipientSecret
    )}/${getSignatoryID(signatorySecret as SignatorySecret)}`;
}

export function getAgentSignatoryID(agentId: AgentID): SignatoryID {
    return agentId.split("/")[1] as SignatoryID;
}

export function getAgentSignatorySecret(agentSecret: AgentSecret): SignatorySecret {
    return agentSecret.split("/")[1] as SignatorySecret;
}

export function getAgentRecipientID(agentId: AgentID): RecipientID {
    return agentId.split("/")[0] as RecipientID;
}

export function getAgentRecipientSecret(agentSecret: AgentSecret): RecipientSecret {
    return agentSecret.split("/")[0] as RecipientSecret;
}

export function seal<T extends JsonValue>(
    message: T,
    from: RecipientSecret,
    to: RecipientID,
    nOnceMaterial: { in: RawCoValueID; tx: TransactionID }
): Sealed<T> {
    const nOnce = blake3(
        textEncoder.encode(stableStringify(nOnceMaterial))
    ).slice(0, 24);

    const recipientPub = base58.decode(to.substring("recipient_z".length));

    const senderPriv = base58.decode(
        from.substring("recipientSecret_z".length)
    );

    const plaintext = textEncoder.encode(stableStringify(message));

    const sharedSecret = x25519.getSharedSecret(
        senderPriv,
        recipientPub
    );

    const sealedBytes = xsalsa20_poly1305(sharedSecret, nOnce).encrypt(
        plaintext
    );

    return `sealed_U${base64url.encode(
        sealedBytes
    )}` as Sealed<T>
}

export function unseal<T extends JsonValue>(
    sealed: Sealed<T>,
    recipient: RecipientSecret,
    from: RecipientID,
    nOnceMaterial: { in: RawCoValueID; tx: TransactionID }
): T | undefined {
    const nOnce = blake3(
        textEncoder.encode(stableStringify(nOnceMaterial))
    ).slice(0, 24);

    const recipientPriv = base58.decode(
        recipient.substring("recipientSecret_z".length)
    );

    const senderPub = base58.decode(from.substring("recipient_z".length));

    const sealedBytes = base64url.decode(sealed.substring("sealed_U".length));

    const sharedSecret = x25519.getSharedSecret(recipientPriv, senderPub);

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
        blake3(textEncoder.encode(stableStringify(value)))
    )}`;
}

export class StreamingHash {
    state: ReturnType<typeof blake3.create>;

    constructor(fromClone?: ReturnType<typeof blake3.create>) {
        this.state = fromClone || blake3.create({});
    }

    update(value: JsonValue) {
        this.state.update(textEncoder.encode(stableStringify(value)));
    }

    digest(): Hash {
        const hash = this.state.digest();
        return `hash_z${base58.encode(hash)}`;
    }

    clone(): StreamingHash {
        return new StreamingHash(this.state.clone());
    }
}

export type ShortHash = `shortHash_z${string}`;

export function shortHash(value: JsonValue): ShortHash {
    return `shortHash_z${base58.encode(
        blake3(textEncoder.encode(stableStringify(value))).slice(0, 19)
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
    const nOnce = blake3(
        textEncoder.encode(stableStringify(nOnceMaterial))
    ).slice(0, 24);

    const plaintext = textEncoder.encode(stableStringify(value));
    const ciphertext = xsalsa20(keySecretBytes, nOnce, plaintext);
    return `encrypted_U${base64url.encode(ciphertext)}` as Encrypted<T, N>;
}

export function encryptForTransaction<T extends JsonValue>(
    value: T,
    keySecret: KeySecret,
    nOnceMaterial: { in: RawCoValueID; tx: TransactionID }
): Encrypted<T, { in: RawCoValueID; tx: TransactionID }> {
    return encrypt(value, keySecret, nOnceMaterial);
}

export function encryptKeySecret(keys: {
    toEncrypt: { id: KeyID; secret: KeySecret };
    encrypting: { id: KeyID; secret: KeySecret };
}): {
    encryptedID: KeyID;
    encryptingID: KeyID;
    encrypted: Encrypted<KeySecret, { encryptedID: KeyID; encryptingID: KeyID }>;
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
    const nOnce = blake3(
        textEncoder.encode(stableStringify(nOnceMaterial))
    ).slice(0, 24);

    const ciphertext = base64url.decode(
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
    encrypted: Encrypted<T, { in: RawCoValueID; tx: TransactionID }>,
    keySecret: KeySecret,
    nOnceMaterial: { in: RawCoValueID; tx: TransactionID }
): T | undefined {
    return decrypt(encrypted, keySecret, nOnceMaterial);
}

export function decryptKeySecret(
    encryptedInfo: {
        encryptedID: KeyID;
        encryptingID: KeyID;
        encrypted: Encrypted<KeySecret, { encryptedID: KeyID; encryptingID: KeyID }>;
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

export function createdNowUnique(): {createdAt: `2${string}`, uniqueness: `z${string}`} {
    const createdAt = (new Date()).toISOString() as `2${string}`;
    return {
        createdAt,
        uniqueness: uniquenessForHeader(),
    }
}