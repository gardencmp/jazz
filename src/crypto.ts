import { ed25519, x25519 } from "@noble/curves/ed25519";
import { xsalsa20_poly1305, xsalsa20 } from "@noble/ciphers/salsa";
import { JsonValue } from "./jsonValue";
import { base58, base64url } from "@scure/base";
import stableStringify from "fast-json-stable-stringify";
import { blake3 } from "@noble/hashes/blake3";
import { randomBytes } from "@noble/ciphers/webcrypto/utils";
import { MultiLogID, SessionID, TransactionID } from "./multilog";

export type SignatorySecret = `signatorySecret_z${string}`;
export type SignatoryID = `signatory_z${string}`;
export type Signature = `signature_z${string}`;

export type RecipientSecret = `recipientSecret_z${string}`;
export type RecipientID = `recipient_z${string}`;
export type Sealed<T> = `sealed_U${string}` & { __type: T };

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function newRandomSignatory(): SignatorySecret {
    return `signatorySecret_z${base58.encode(
        ed25519.utils.randomPrivateKey()
    )}`;
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

export function getRecipientID(secret: RecipientSecret): RecipientID {
    return `recipient_z${base58.encode(
        x25519.getPublicKey(
            base58.decode(secret.substring("recipientSecret_z".length))
        )
    )}`;
}

export type SealedSet<T> = {
    [recipient: RecipientID]: Sealed<T>;
};

export function seal<T extends JsonValue>(
    message: T,
    from: RecipientSecret,
    to: Set<RecipientID>,
    nOnceMaterial: { in: MultiLogID; tx: TransactionID }
): SealedSet<T> {
    const nOnce = blake3(
        textEncoder.encode(stableStringify(nOnceMaterial))
    ).slice(0, 24);

    const recipientsSorted = Array.from(to).sort();
    const recipientPubs = recipientsSorted.map((recipient) => {
        return base58.decode(recipient.substring("recipient_z".length));
    });
    const senderPriv = base58.decode(
        from.substring("recipientSecret_z".length)
    );

    const plaintext = textEncoder.encode(stableStringify(message));

    const sealedSet: SealedSet<T> = {};

    for (let i = 0; i < recipientsSorted.length; i++) {
        const recipient = recipientsSorted[i];
        const sharedSecret = x25519.getSharedSecret(
            senderPriv,
            recipientPubs[i]
        );

        const sealedBytes = xsalsa20_poly1305(sharedSecret, nOnce).encrypt(
            plaintext
        );

        sealedSet[recipient] = `sealed_U${base64url.encode(
            sealedBytes
        )}` as Sealed<T>;
    }

    return sealedSet;
}

export function openAs<T extends JsonValue>(
    sealedSet: SealedSet<T>,
    recipient: RecipientSecret,
    from: RecipientID,
    nOnceMaterial: { in: MultiLogID; tx: TransactionID }
): T | undefined {
    const nOnce = blake3(
        textEncoder.encode(stableStringify(nOnceMaterial))
    ).slice(0, 24);

    const recipientPriv = base58.decode(
        recipient.substring("recipientSecret_z".length)
    );

    const senderPub = base58.decode(from.substring("recipient_z".length));

    const sealed = sealedSet[getRecipientID(recipient)];

    if (!sealed) {
        return undefined;
    }

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
    nOnceMaterial: { in: MultiLogID; tx: TransactionID }
): Encrypted<T, { in: MultiLogID; tx: TransactionID }> {
    return encrypt(value, keySecret, nOnceMaterial);
}

export function sealKeySecret(keys: {
    toSeal: { id: KeyID; secret: KeySecret };
    sealing: { id: KeyID; secret: KeySecret };
}): {
    sealed: KeyID;
    sealing: KeyID;
    encrypted: Encrypted<KeySecret, { sealed: KeyID; sealing: KeyID }>;
} {
    const nOnceMaterial = {
        sealed: keys.toSeal.id,
        sealing: keys.sealing.id,
    };

    return {
        sealed: keys.toSeal.id,
        sealing: keys.sealing.id,
        encrypted: encrypt(
            keys.toSeal.secret,
            keys.sealing.secret,
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
    encrypted: Encrypted<T, { in: MultiLogID; tx: TransactionID }>,
    keySecret: KeySecret,
    nOnceMaterial: { in: MultiLogID; tx: TransactionID }
): T | undefined {
    return decrypt(encrypted, keySecret, nOnceMaterial);
}

export function unsealKeySecret(
    sealedInfo: {
        sealed: KeyID;
        sealing: KeyID;
        encrypted: Encrypted<KeySecret, { sealed: KeyID; sealing: KeyID }>;
    },
    sealingSecret: KeySecret
): KeySecret | undefined {
    const nOnceMaterial = {
        sealed: sealedInfo.sealed,
        sealing: sealedInfo.sealing,
    };

    return decrypt(sealedInfo.encrypted, sealingSecret, nOnceMaterial);
}
