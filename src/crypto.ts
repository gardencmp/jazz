import { ed25519, x25519 } from "@noble/curves/ed25519";
import { xsalsa20_poly1305, xsalsa20 } from "@noble/ciphers/salsa";
import { JsonValue } from "./jsonValue";
import { base58, base64url } from "@scure/base";
import stableStringify from "fast-json-stable-stringify";
import { blake2b } from "@noble/hashes/blake2b";
import { concatBytes } from "@noble/ciphers/utils";
import { blake3 } from "@noble/hashes/blake3";
import { randomBytes } from "@noble/ciphers/webcrypto/utils";

export type SignatorySecret = `signatorySecret_z${string}`;
export type SignatoryID = `signatory_z${string}`;
export type Signature = `signature_z${string}`;

export type RecipientSecret = `recipientSecret_z${string}`;
export type RecipientID = `recipient_z${string}`;
export type Sealed = `sealed_U${string}`;

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

// same construction as libsodium sealed_Uox
export function sealFor(recipient: RecipientID, message: JsonValue): Sealed {
    const ephemeralSenderPriv = x25519.utils.randomPrivateKey();
    const ephemeralSenderPub = x25519.getPublicKey(ephemeralSenderPriv);
    const recipientPub = base58.decode(
        recipient.substring("recipient_z".length)
    );
    const sharedSecret = x25519.getSharedSecret(
        ephemeralSenderPriv,
        recipientPub
    );
    const nonce = blake2b(concatBytes(ephemeralSenderPub, recipientPub)).slice(
        0,
        24
    );

    const plaintext = textEncoder.encode(stableStringify(message));

    const sealedBox = concatBytes(
        ephemeralSenderPub,
        xsalsa20_poly1305(sharedSecret, nonce).encrypt(plaintext)
    );

    return `sealed_U${base64url.encode(sealedBox)}`;
}

export function unsealAs(
    recipientSecret: RecipientSecret,
    sealed: Sealed
): JsonValue | undefined {
    const sealedBytes = base64url.decode(sealed.substring("sealed_U".length));

    const ephemeralSenderPub = sealedBytes.slice(0, 32);
    const recipentPriv = base58.decode(
        recipientSecret.substring("recipientSecret_z".length)
    );
    const recipientPub = x25519.getPublicKey(recipentPriv);
    const sharedSecret = x25519.getSharedSecret(
        recipentPriv,
        ephemeralSenderPub
    );
    const nonce = blake2b(concatBytes(ephemeralSenderPub, recipientPub)).slice(
        0,
        24
    );

    const ciphertext = sealedBytes.slice(32);
    try {
        const plaintext = xsalsa20_poly1305(sharedSecret, nonce).decrypt(
            ciphertext
        );
        return JSON.parse(textDecoder.decode(plaintext));
    } catch (e) {
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

export type EncryptedStreamChunk<T extends JsonValue> =
    `encryptedChunk_U${string}`;

export type SecretKey = `secretKey_z${string}`;

export function newRandomSecretKey(): SecretKey {
    return `secretKey_z${base58.encode(randomBytes(32))}`;
}

export class EncryptionStream {
    secretKey: Uint8Array;
    nonce: Uint8Array;
    counter: number;

    constructor(secretKey: SecretKey, nonce: Uint8Array) {
        this.secretKey = base58.decode(
            secretKey.substring("secretKey_z".length)
        );
        this.nonce = nonce;
        this.counter = 0;
    }

    static resume(secretKey: SecretKey, nonce: Uint8Array, counter: number) {
        const stream = new EncryptionStream(secretKey, nonce);
        stream.counter = counter;
        return stream;
    }

    encrypt<T extends JsonValue>(value: T): EncryptedStreamChunk<T> {
        const plaintext = textEncoder.encode(stableStringify(value));
        const ciphertext = xsalsa20(
            this.secretKey,
            this.nonce,
            plaintext,
            new Uint8Array(plaintext.length),
            this.counter
        );
        this.counter++;

        return `encryptedChunk_U${base64url.encode(ciphertext)}`;
    }
}

export class DecryptionStream {
    secretKey: Uint8Array;
    nonce: Uint8Array;
    counter: number;

    constructor(secretKey: SecretKey, nonce: Uint8Array) {
        this.secretKey = base58.decode(
            secretKey.substring("secretKey_z".length)
        );
        this.nonce = nonce;
        this.counter = 0;
    }

    static resume(secretKey: SecretKey, nonce: Uint8Array, counter: number) {
        const stream = new DecryptionStream(secretKey, nonce);
        stream.counter = counter;
        return stream;
    }

    decrypt<T extends JsonValue>(
        encryptedChunk: EncryptedStreamChunk<T>
    ): T | undefined {
        const ciphertext = base64url.decode(
            encryptedChunk.substring("encryptedChunk_U".length)
        );
        const plaintext = xsalsa20(
            this.secretKey,
            this.nonce,
            ciphertext,
            new Uint8Array(ciphertext.length),
            this.counter
        );
        this.counter++;

        try {
            return JSON.parse(textDecoder.decode(plaintext));
        } catch (e) {
            return undefined;
        }
    }
}
