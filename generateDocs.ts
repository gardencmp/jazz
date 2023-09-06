import { readFile, writeFile } from "fs/promises";
import { Application, JSONOutput } from "typedoc";

async function main() {
    // Application.bootstrap also exists, which will not load plugins
    // Also accepts an array of option readers if you want to disable
    // TypeDoc's tsconfig.json/package.json/typedoc.json option readers
    const app = await Application.bootstrapWithPlugins({
        entryPoints: ["packages/cojson/src/index.ts"],
        tsconfig: "packages/cojson/tsconfig.json",
        sort: ["required-first"],
    });

    const project = await app.convert();

    if (project) {

        // Alternatively generate JSON output
        await app.generateJson(project, "./docsTmp/documentation.json");

        const docs = JSON.parse(
            await readFile("./docsTmp/documentation.json", "utf8")
        ) as JSONOutput.ProjectReflection;

        let docsMd = "";

        for (let group of docs.groups || []) {
            docsMd += `# ${group.title}\n\n`;

            for (let childId of group.children || []) {
                const child = docs.children!.find(
                    (child) => child.id === childId
                )!;

                docsMd += `## ${child.name}\n\n`;

                if (child.comment) {
                    docsMd +=
                        child.comment.summary
                            .map((token) =>
                                token.kind === "text" || token.kind === "code"
                                    ? token.text
                                    : ""
                            )
                            .join("") + "\n\n";

                    docsMd +=
                        child.comment.blockTags
                            ?.map((blockTag) =>
                                blockTag.tag === "@example"
                                    ? "### Example:\n\n" +
                                      blockTag.content
                                          .map((token) =>
                                              token.kind === "text" ||
                                              token.kind === "code"
                                                  ? token.text
                                                  : ""
                                          )
                                          .join("")
                                    : ""
                            )
                            .join("\n\n") + "\n\n";
                } else {
                    docsMd += "TODO: document\n\n";
                }

                if (child.kind === 128) {
                    for (let group of child.groups || []) {
                        docsMd += `### ${group.title}\n\n`;

                        for (let memberId of group.children || []) {
                            const member = child.children!.find(
                                (child) => child.id === memberId
                            )!;

                            if (member.kind === 2048 || member.kind === 512) {
                                docsMd += `#### ${
                                    member.flags.isStatic
                                        ? `\`${child.name}.\``
                                        : ""
                                }**\`${
                                    member.name === "constructor"
                                        ? "new " + child.name
                                        : member.name
                                }(${(
                                    member.signatures?.[0]?.parameters?.map(
                                        (param) => param.name
                                    ) || []
                                ).join(", ")})\`**\n\n`;

                                for (let signature of member.signatures || []) {
                                    docsMd +=
                                        "```typescript\n" +
                                        `${
                                            member.name === "constructor"
                                                ? "new " + child.name
                                                : (member.flags.isStatic
                                                      ? child.name
                                                      : child.name[0].toLowerCase() +
                                                        child.name.slice(1)) +
                                                  "." +
                                                  member.name
                                        }${
                                            signature.typeParameter
                                                ? `<${signature.typeParameter
                                                      .map(renderTypeParam)
                                                      .join(", ")}>`
                                                : ""
                                        }(${(
                                            signature.parameters?.map(
                                                (param) =>
                                                    `${
                                                        param.name
                                                    }: ${renderType(
                                                        param.type
                                                    )}`
                                            ) || []
                                        ).join(", ")}): ${renderType(
                                            signature.type
                                        )}\n` +
                                        "```\n";
                                }
                            }
                        }
                    }
                }
            }
        }

        await writeFile("./DOCS.md", docsMd);

        function renderType(t?: JSONOutput.SomeType): string {
            if (!t) return "";
            if (t.type === "reference") {
                return (
                    t.name +
                    (t.typeArguments
                        ? "<" + t.typeArguments.map(renderType).join(", ") + ">"
                        : "")
                );
            } else if (t.type === "intrinsic") {
                return t.name;
            } else if (t.type === "literal") {
                return JSON.stringify(t.value);
            } else if (t.type === "union") {
                return [...new Set(t.types.map(renderType))].join(" | ");
            } else if (t.type === "indexedAccess") {
                return (
                    renderType(t.objectType) +
                    "[" +
                    renderType(t.indexType) +
                    "]"
                );
            } else if (t.type === "reflection") {
                if (t.declaration.indexSignature) {
                    return (
                        "{ [" +
                        t.declaration.indexSignature?.parameters?.[0].name +
                        ": " +
                        renderType(
                            t.declaration.indexSignature?.parameters?.[0].type
                        ) +
                        "]: " +
                        renderType(t.declaration.indexSignature?.type) +
                        " }"
                    );
                } else {
                    return `{${t.declaration.children
                        ?.map(
                            (child) =>
                                `${child.name}: ${renderType(child.type)}`
                        )
                        .join(", ")}}`;
                }
            } else if (t.type === "array") {
                return renderType(t.elementType) + "[]";
            } else if (t.type === "templateLiteral") {
                const matchingNamedType = docs.children?.find(
                    (child) =>
                        child.variant === "declaration" &&
                        child.type?.type === "templateLiteral" &&
                        child.type.head === t.head &&
                        child.type.tail.every(
                            (piece, i) => piece[1] === t.tail[i][1]
                        )
                );

                if (matchingNamedType) {
                    return matchingNamedType.name;
                } else {
                    if (
                        t.head === "sealerSecret_z" &&
                        t.tail[0][1] === "/signerSecret_z"
                    ) {
                        return "AgentSecret";
                    } else if (
                        t.head === "sealer_z" &&
                        t.tail[0][1] === "/signer_z"
                    ) {
                        if (t.tail[1] && t.tail[1][1] === "_session_z") {
                            return "SessionID";
                        } else {
                            return "AgentID";
                        }
                    } else {
                        return "TEMPLATE_LITERAL";
                    }
                }
            } else {
                return "COMPLEX_TYPE_" + t.type;
            }
        }

        // function renderTemplateLiteral(tempLit: JSONOutput.TemplateLiteralType) {
        //     return tempLit.head + tempLit.tail.map((piece) => piece[0] + piece[1]).join("");
        // }

        // function resolveTemplateLiteralPieceType(t: SomeType): string {
        //     if (t.type === "string") {
        //         return "${string}"
        //     }
        //     if (t.type === "reference") {
        //         const referencedType = docs.children?.find(
        //             (child) => child.name === t.name
        //         );

        //     }
        // }

        function renderTypeParam(
            t?: JSONOutput.TypeParameterReflection
        ): string {
            if (!t) return "";
            return t.name + (t.type ? " extends " + renderType(t.type) : "");
        }
    }
}

main().catch(console.error);
