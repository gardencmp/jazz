const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function base64URLtoBytes(base64: string) {
    base64 = base64.replace(/=/g, "");
    const n = base64.length;
    const rem = n % 4;
    const k = rem && rem - 1; // how many bytes the last base64 chunk encodes
    const m = (n >> 2) * 3 + k; // total encoded bytes

    const encoded = new Uint8Array(n + 3);
    encoder.encodeInto(base64 + "===", encoded);

    for (let i = 0, j = 0; i < n; i += 4, j += 3) {
        const x =
            (lookup[encoded[i]!]! << 18) +
            (lookup[encoded[i + 1]!]! << 12) +
            (lookup[encoded[i + 2]!]! << 6) +
            lookup[encoded[i + 3]!]!;
        encoded[j] = x >> 16;
        encoded[j + 1] = (x >> 8) & 0xff;
        encoded[j + 2] = x & 0xff;
    }
    return new Uint8Array(encoded.buffer, 0, m);
}

export function bytesToBase64url(bytes: Uint8Array) {
    const m = bytes.length;
    const k = m % 3;
    const n = Math.floor(m / 3) * 4 + (k && k + 1);
    const N = Math.ceil(m / 3) * 4;
    const encoded = new Uint8Array(N);

    for (let i = 0, j = 0; j < m; i += 4, j += 3) {
        const y =
            (bytes[j]! << 16) + (bytes[j + 1]! << 8) + (bytes[j + 2]! | 0);
        encoded[i] = encodeLookup[y >> 18]!;
        encoded[i + 1] = encodeLookup[(y >> 12) & 0x3f]!;
        encoded[i + 2] = encodeLookup[(y >> 6) & 0x3f]!;
        encoded[i + 3] = encodeLookup[y & 0x3f]!;
    }

    let base64 = decoder.decode(new Uint8Array(encoded.buffer, 0, n));
    if (k === 1) base64 += "==";
    if (k === 2) base64 += "=";
    return base64;
}

const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const lookup = Object.fromEntries(
    Array.from(alphabet).map((a, i) => [a.charCodeAt(0), i])
);
lookup["=".charCodeAt(0)] = 0;

const encodeLookup = Object.fromEntries(
    Array.from(alphabet).map((a, i) => [i, a.charCodeAt(0)])
);
