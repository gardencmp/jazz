import { genDocsMd } from "./genDocsMd";

export const manuallyIgnore = new Set(["CojsonInternalTypes"]);

async function main() {
    await genDocsMd();
}

export function indent(text: string): string {
    return text
        .split("\n")
        .map((line) => "  " + line)
        .join("\n");
}

export function indentEnd(text: string): string {
    return text
        .split("\n")
        .map((line, i) => (i === 0 ? line : "  " + line))
        .join("\n");
}

main().catch(console.error);
