import { readFile, writeFile } from "fs/promises";
import { genDocsMd } from "./genDocsMd";

export const manuallyIgnore = new Set(["CojsonInternalTypes"]);

async function main() {
    const exampleFilesInDocs = {
        "examples/chat/src/app.tsx": "homepage/homepage-jazz/pages/index.mdx",
        "examples/chat/src/chatWindow.tsx": "homepage/homepage-jazz/pages/index.mdx",
    };

    for (const [src, dest] of Object.entries(exampleFilesInDocs)) {
        const srcStr = await readFile(src, "utf8");
        const destStr = await readFile(dest, "utf8");
        const srcFilename = src.split("/").pop()!;
        const regexp = new RegExp(
            '```(\\w+?) filename="' + srcFilename + '"(.+?)\n(.+?)```',
            "s"
        );
        console.log(regexp);
        await writeFile(
            dest,
            destStr.replace(regexp, (match, filetype, attrs, _oldCode) => {
                console.log(
                    { filetype },
                    { attrs },
                    { oldCode: _oldCode.slice(0, 30) }
                );
                return (
                    "```" +
                    filetype +
                    ' filename="' +
                    srcFilename +
                    '"' +
                    attrs +
                    "\n" +
                    srcStr +
                    "```"
                );
            })
        );
    }

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
