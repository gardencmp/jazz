import { readFile, writeFile } from "fs/promises";
import { Application, JSONOutput } from "typedoc";

const manuallyIgnore = new Set(["CojsonInternalTypes"]);

async function main() {
    // Application.bootstrap also exists, which will not load plugins
    // Also accepts an array of option readers if you want to disable
    // TypeDoc's tsconfig.json/package.json/typedoc.json option readers
    const packageDocs = Object.entries({
        cojson: "index.ts",
        "jazz-react": "index.tsx",
        "jazz-browser": "index.ts",
    }).map(async ([packageName, entryPoint]) => {
        const app = await Application.bootstrapWithPlugins({
            entryPoints: [`packages/${packageName}/src/${entryPoint}`],
            tsconfig: `packages/${packageName}/tsconfig.json`,
            sort: ["required-first"],
        });

        const project = await app.convert();

        if (!project) {
            throw new Error("Failed to convert project" + packageName);
        }
        // Alternatively generate JSON output
        await app.generateJson(project, `docsTmp/${packageName}.json`);

        const docs = JSON.parse(
            await readFile(`docsTmp/${packageName}.json`, "utf8")
        ) as JSONOutput.ProjectReflection;

        return (
            `# ${packageName}\n\n` +
            docs
                .groups!.map((group) => {
                    return group.children
                        ?.map((childId) => {
                            const child = docs.children!.find(
                                (child) => child.id === childId
                            )!;

                            if (manuallyIgnore.has(child.name)) {
                                return "";
                            }

                            return (
                                `## \`${renderChildName(child)}\` (${group.title
                                    .toLowerCase()
                                    .replace("ces", "ce")
                                    .replace(/es$/, "")
                                    .replace(
                                        "ns",
                                        "n"
                                    )} in \`${packageName}\`)\n\n` +
                                renderChildType(child) +
                                renderComment(child.comment) +
                                (child.kind === 128 || child.kind === 256
                                    ? child.groups
                                          ?.map((group) =>
                                              renderChildGroup(child, group)
                                          )
                                          .join("\n\n")
                                    : "TODO: doc generator not implemented yet")
                            );
                        })
                        .join("\n\n----\n\n");
                })
                .join("\n\n----\n\n")
        );

        function renderComment(comment?: JSONOutput.Comment): string {
            if (comment) {
                return (
                    comment.summary
                        .map((token) =>
                            token.kind === "text" || token.kind === "code"
                                ? token.text
                                : ""
                        )
                        .join("") +
                    "\n\n" +
                    (comment.blockTags || [])
                        .map((blockTag) =>
                            blockTag.tag === "@example"
                                ? "##### Example:\n\n" +
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
                        .join("\n\n") +
                    "\n\n"
                );
            } else {
                return "TODO: document\n\n";
            }
        }

        function renderChildName(child: JSONOutput.DeclarationReflection) {
            if (child.signatures) {
                if (
                    child.signatures[0].type?.type === "reference" &&
                    child.signatures[0].type.qualifiedName ===
                        "React.JSX.Element"
                ) {
                    return `<${child.name}/>`;
                } else {
                    return (
                        child.name +
                        `(${(child.signatures[0].parameters || [])
                            .map(renderParamSimple)
                            .join(", ")})`
                    );
                }
            } else {
                return child.name;
            }
        }

        function renderChildType(
            child: JSONOutput.DeclarationReflection
        ): string {
            const isClass = child.kind === 128;
            const isTypeDef = child.kind === 2097152;
            const isInterface = child.kind === 256;
            const isFunction = !!child.signatures;
            return (
                "```typescript\n" +
                `export ${
                    isClass
                        ? "class"
                        : isTypeDef
                        ? "type"
                        : isFunction
                        ? "function"
                        : isInterface
                        ? "interface"
                        : ""
                } ${child.name}` +
                (child.typeParameters
                    ? "<" +
                      child.typeParameters.map(renderTypeParam).join(", ") +
                      ">"
                    : "") +
                (child.extendedTypes
                    ? " extends " +
                      child.extendedTypes.map(renderType).join(", ")
                    : "") +
                (child.implementedTypes
                    ? " implements " +
                      child.implementedTypes.map(renderType).join(", ")
                    : "") +
                (isClass || isInterface
                    ? " {...}"
                    : isTypeDef
                    ? ` = ${renderType(child.type)}`
                    : child.signatures
                    ? `(${(child.signatures[0].parameters || [])
                          .map(renderParam)
                          .join(", ")}): ${renderType(
                          child.signatures[0].type
                      )}`
                    : "") +
                "\n```\n"
            );
        }

        function renderChildGroup(
            child: JSONOutput.DeclarationReflection,
            group: JSONOutput.ReflectionGroup
        ): string {
            return (
                `### ${group.title}\n\n` +
                group.children
                    ?.map((memberId) => {
                        const member = child.children!.find(
                            (child) => child.id === memberId
                        )!;

                        if (member.kind === 2048 || member.kind === 512) {
                            return documentConstructorOrMethod(member, child);
                        } else if (
                            member.kind === 1024 ||
                            member.kind === 262144
                        ) {
                            return documentProperty(member, child);
                        } else {
                            return "Unknown member kind " + member.kind;
                        }
                    })
                    .join("\n\n")
            );
        }

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
            } else if (t.type === "intersection") {
                return [...new Set(t.types.map(renderType))].join(" & ");
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
                } else if (t.declaration.children) {
                    return `{${t.declaration.children
                        .map(
                            (child) =>
                                `${child.name}${
                                    child.flags.isOptional ? "?" : ""
                                }: ${renderType(child.type)}`
                        )
                        .join(", ")}}`;
                } else if (t.declaration.signatures) {
                    if (t.declaration.signatures.length > 1) {
                        return "COMPLEX_TYPE_MULTIPLE_INLINE_SIGNATURES";
                    } else {
                        return `(${(
                            t.declaration.signatures[0].parameters || []
                        ).map(renderParam)}) => ${renderType(
                            t.declaration.signatures[0].type
                        )}`;
                    }
                } else {
                    return "COMPLEX_TYPE_REFLECTION";
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

        function renderParam(param: JSONOutput.ParameterReflection) {
            return param.name === "__namedParameters"
                ? renderType(param.type)
                : `${param.name}: ${renderType(param.type)}`;
        }

        function renderParamSimple(param: JSONOutput.ParameterReflection) {
            return param.name === "__namedParameters" &&
                param.type?.type === "reflection"
                ? `{${param.type?.declaration.children
                      ?.map(
                          (child) =>
                              child.name + (child.flags.isOptional ? "?" : "")
                      )
                      .join(", ")}}${param.defaultValue ? "?" : ""}`
                : param.name + (param.defaultValue ? "?" : "");
        }

        function documentConstructorOrMethod(
            member: JSONOutput.DeclarationReflection,
            child: JSONOutput.DeclarationReflection
        ) {
            const stem =
                member.name === "constructor"
                    ? "new " + child.name
                    : (member.flags.isStatic
                          ? child.name
                          : child.name[0].toLowerCase() + child.name.slice(1)) +
                      "." +
                      member.name;

            return (
                `<details>\n<summary><code>${stem}(${(
                    member.signatures?.[0]?.parameters?.map(
                        renderParamSimple
                    ) || []
                ).join(", ")})</code> ${
                    member.inheritedFrom
                        ? "(from <code>" +
                          member.inheritedFrom.name.split(".")[0] +
                          "</code>) "
                        : ""
                } ${
                    member.signatures?.[0]?.comment ? "" : "(undocumented)"
                }</summary>\n\n` +
                member.signatures?.map((signature) => {
                    return (
                        "```typescript\n" +
                        `${stem}${
                            signature.typeParameter
                                ? `<${signature.typeParameter
                                      .map(renderTypeParam)
                                      .join(", ")}>`
                                : ""
                        }(${
                            (
                                signature.parameters?.map(
                                    (param) =>
                                        `\n  ${param.name}${
                                            param.defaultValue ? "?" : ""
                                        }: ${renderType(param.type)}${
                                            param.defaultValue
                                                ? ` = ${param.defaultValue}`
                                                : ""
                                        }`
                                ) || []
                            ).join(",") +
                            (signature.parameters?.length ? "\n" : "")
                        }): ${renderType(signature.type)}\n` +
                        "```\n" +
                        renderComment(signature.comment)
                    );
                }) +
                "</details>\n\n"
            );
        }

        function documentProperty(
            member: JSONOutput.DeclarationReflection,
            child: JSONOutput.DeclarationReflection
        ) {
            const stem = member.flags.isStatic
                ? child.name
                : child.name[0].toLowerCase() + child.name.slice(1);
            return (
                `<details>\n<summary><code>${stem}.${member.name}</code> ${
                    member.inheritedFrom
                        ? "(from <code>" +
                          member.inheritedFrom.name.split(".")[0] +
                          "</code>) "
                        : ""
                } ${
                    member.comment ? "" : "(undocumented)"
                }</summary>\n\n` +
                "```typescript\n" +
                `${member.getSignature ? "get " : ""}${stem}.${member.name}${
                    member.getSignature ? "()" : ""
                }: ${renderType(member.type || member.getSignature?.type)}\n` +
                "```\n" +
                renderComment(member.comment) +
                "</details>\n\n"
            );
        }
    });

    await writeFile(
        "./DOCS.md",
        (await Promise.all(packageDocs)).join("\n\n\n")
    );
}

main().catch(console.error);
