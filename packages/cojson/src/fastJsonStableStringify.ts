// adapted from fast-json-stable-stringify (https://github.com/epoberezkin/fast-json-stable-stringify)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stableStringify(data: any): string | undefined {
    const cycles = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const seen: any[] = [];
    let node = data;

    if (node && node.toJSON && typeof node.toJSON === "function") {
        node = node.toJSON();
    }

    if (node === undefined) return;
    if (typeof node == "number") return isFinite(node) ? "" + node : "null";
    if (typeof node !== "object") {
        if (typeof node === "string" && (node.startsWith("encrypted_U") || node.startsWith("binary_U"))) {
            return `"${node}"`;
        }
        return JSON.stringify(node);
    }

    let i, out;
    if (Array.isArray(node)) {
        out = "[";
        for (i = 0; i < node.length; i++) {
            if (i) out += ",";
            out += stableStringify(node[i]) || "null";
        }
        return out + "]";
    }

    if (node === null) return "null";

    if (seen.indexOf(node) !== -1) {
        if (cycles) return JSON.stringify("__cycle__");
        throw new TypeError("Converting circular structure to JSON");
    }

    const seenIndex = seen.push(node) - 1;
    const keys = Object.keys(node).sort();
    out = "";
    for (i = 0; i < keys.length; i++) {
        const key = keys[i]!;
        const value = stableStringify(node[key]);

        if (!value) continue;
        if (out) out += ",";
        out += JSON.stringify(key) + ":" + value;
    }
    seen.splice(seenIndex, 1);
    return "{" + out + "}";
}
