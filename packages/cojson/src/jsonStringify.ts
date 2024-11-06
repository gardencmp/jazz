// adapted from fast-json-stable-stringify (https://github.com/epoberezkin/fast-json-stable-stringify)

export type Stringified<T> = string & { __type: T };

export function stableStringify<T>(data: T): Stringified<T>;
export function stableStringify(data: undefined): undefined;
export function stableStringify<T>(
  data: T | undefined,
): Stringified<T> | undefined {
  const cycles = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seen: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node = data as any;

  if (node && node.toJSON && typeof node.toJSON === "function") {
    node = node.toJSON();
  }

  if (node === undefined) return;
  if (typeof node == "number")
    return (isFinite(node) ? "" + node : "null") as Stringified<T>;
  if (typeof node !== "object") {
    if (
      typeof node === "string" &&
      (node.startsWith("encrypted_U") || node.startsWith("binary_U"))
    ) {
      return `"${node}"` as Stringified<T>;
    }
    return JSON.stringify(node) as Stringified<T>;
  }

  let i, out;
  if (Array.isArray(node)) {
    out = "[";
    for (i = 0; i < node.length; i++) {
      if (i) out += ",";
      out += stableStringify(node[i]) || "null";
    }
    return (out + "]") as Stringified<T>;
  }

  if (node === null) return "null" as Stringified<T>;

  if (seen.indexOf(node) !== -1) {
    if (cycles) return JSON.stringify("__cycle__") as Stringified<T>;
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
  return ("{" + out + "}") as Stringified<T>;
}

export function parseJSON<T>(json: Stringified<T>): T {
  return JSON.parse(json);
}
