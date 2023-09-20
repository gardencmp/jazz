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
        "jazz-react-media-images": "index.tsx",
        "jazz-browser": "index.ts",
        "jazz-browser-media-images": "index.ts",
    }).map(async ([packageName, entryPoint]) => {
        const app = await Application.bootstrapWithPlugins({
            entryPoints: [`packages/${packageName}/src/${entryPoint}`],
            tsconfig: `packages/${packageName}/tsconfig.json`,
            sort: ["required-first"],
            groupOrder: ["Functions", "Classes", "TypeAliases", "Namespaces"],
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
                                `## \`${renderChildName(
                                    child
                                )}\` <sub><sup>(${group.title
                                    .toLowerCase()
                                    .replace("bles", "ble")
                                    .replace("ces", "ce")
                                    .replace(/es$/, "")
                                    .replace(
                                        "ns",
                                        "n"
                                    )} in \`${packageName}\`)</sup></sub>\n\n` +
                                renderChildType(child) +
                                renderComment(child.comment) +
                                (child.kind === 128 || child.kind === 256
                                    ? child.groups
                                          ?.map((group) =>
                                              renderChildGroup(child, group)
                                          )
                                          .join("<br/>\n\n")
                                    : child.kind === 4
                                    ? child.groups
                                          ?.map((group) =>
                                              renderChildGroup(child, group)
                                          )
                                          .join("<br/>\n\n")
                                    : "TODO: doc generator not implemented yet " +
                                      child.kind)
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
            const isNamespace = child.kind === 4;
            const isFunction = !!child.signatures;

            const kind = isClass
                ? "class"
                : isTypeDef
                ? "type"
                : isFunction
                ? "function"
                : isInterface
                ? "interface"
                : isNamespace
                ? "namespace"
                : "";

            return (
                "```typescript\n" +
                `export ${kind} ${child.name}` +
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
                (isClass || isInterface || isNamespace
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
                `### ${group.title} in \`${child.name}\`\n\n` +
                group.children
                    ?.map((memberId) => {
                        const member = child.children!.find(
                            (member) => member.id === memberId
                        )!;

                        if (member.kind === 2048 || member.kind === 512) {
                            if (
                                member.signatures?.every((sig) =>
                                    sig.comment?.modifierTags?.includes(
                                        "@internal"
                                    )
                                )
                            ) {
                                return "";
                            } else {
                                return documentConstructorOrMethod(
                                    member,
                                    child
                                );
                            }
                        } else if (
                            member.kind === 1024 ||
                            member.kind === 262144
                        ) {
                            if (
                                member.comment?.modifierTags?.includes(
                                    "@internal"
                                )
                            ) {
                                return "";
                            } else {
                                return documentProperty(member, child);
                            }
                        } else if (member.kind === 2097152) {
                            if (
                                member.comment?.modifierTags?.includes(
                                    "@internal"
                                )
                            ) {
                                return "";
                            } else {
                                return documentProperty(
                                    { ...member, flags: { isStatic: true } },
                                    child
                                );
                            }
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
                return [
                    ...new Set(
                        t.types.map((t) =>
                            t.type === "intersection" || t.type === "union"
                                ? `(${renderType(t)})`
                                : renderType(t)
                        )
                    ),
                ]
                    .sort((a, b) => {
                        return a === "undefined" || a === "null"
                            ? 1
                            : b === "undefined" || b === "null"
                            ? -1
                            : a.localeCompare(b);
                    })
                    .join(" | ");
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
                        `{${
                            t.declaration.children
                                ? t.declaration.children
                                      .map(
                                          (child) =>
                                              `  ${child.name}${
                                                  child.flags.isOptional
                                                      ? "?"
                                                      : ""
                                              }: ${indentEnd(
                                                  renderType(child.type)
                                              )},`
                                      )
                                      .join("\n")
                                : ""
                        }\n  [` +
                        t.declaration.indexSignature?.parameters?.[0].name +
                        ": " +
                        renderType(
                            t.declaration.indexSignature?.parameters?.[0].type
                        ) +
                        "]: " +
                        indentEnd(
                            renderType(t.declaration.indexSignature?.type)
                        ) +
                        " }"
                    );
                } else if (t.declaration.children) {
                    return `{\n${t.declaration.children
                        .map((child) =>
                            child.signatures
                                ? child.signatures
                                      .map(
                                          (signature) =>
                                              `  ${child.name}(${
                                                  signature.parameters
                                                      ? "\n  " +
                                                        indent(
                                                            signature.parameters
                                                                .map((p) =>
                                                                    indentEnd(
                                                                        renderParam(
                                                                            p
                                                                        )
                                                                    )
                                                                )
                                                                .join(",\n  ")
                                                        ) +
                                                        "\n  )"
                                                      : "()"
                                              }: ${indentEnd(
                                                  renderType(signature.type)
                                              )}`
                                      )
                                      .join("\n") + ",\n"
                                : `  ${child.name}${
                                      child.flags.isOptional ? "?" : ""
                                  }: ${indentEnd(renderType(child.type))},\n`
                        )
                        .join("")}}`;
                } else if (t.declaration.signatures) {
                    return t.declaration.signatures
                        .map(
                            (signature) =>
                                `(${(signature.parameters || [])
                                    .map(renderParam)
                                    .join(", ")}) => ${renderType(
                                    signature.type
                                )}`
                        )
                        .join("\n");
                } else {
                    return "COMPLEX_TYPE_REFLECTION";
                }
            } else if (t.type === "array") {
                return renderType(t.elementType) + "[]";
            } else if (t.type === "tuple") {
                return `[${t.elements?.map(renderType).join(", ")}]`;
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
                        return (
                            "`" +
                            t.head +
                            t.tail
                                .map(
                                    (bit) =>
                                        "${" + renderType(bit[0]) + "}" + bit[1]
                                )
                                .join("") +
                            "`"
                        );
                    }
                }
            } else if (t.type === "conditional") {
                const trueRendered = renderType(t.trueType);
                const falseRendered = renderType(t.falseType);

                if (
                    trueRendered.includes("\n") ||
                    falseRendered.includes("\n")
                ) {
                    return (
                        renderType(t.checkType) +
                        " extends " +
                        renderType(t.extendsType) +
                        "\n  ? " +
                        indentEnd(renderType(t.trueType)) +
                        "\n  : " +
                        indentEnd(renderType(t.falseType))
                    );
                } else {
                    return (
                        renderType(t.checkType) +
                        " extends " +
                        renderType(t.extendsType) +
                        " ? " +
                        renderType(t.trueType) +
                        " : " +
                        renderType(t.falseType)
                    );
                }
            } else if (t.type === "inferred") {
                return "infer " + t.name;
            } else if (t.type === "typeOperator") {
                return t.operator + " " + renderType(t.target);
            } else if (t.type === "mapped") {
                return `{\n  [${t.parameter} in ${renderType(
                    t.parameterType
                )}]: ${indentEnd(renderType(t.templateType))}\n}`;
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
                      .join(", ")}}${
                      param.flags.isOptional || param.defaultValue ? "?" : ""
                  }`
                : param.name +
                      (param.flags.isOptional || param.defaultValue ? "?" : "");
        }

        function documentConstructorOrMethod(
            member: JSONOutput.DeclarationReflection,
            child: JSONOutput.DeclarationReflection
        ) {
            const isInClass = child.kind === 128;
            const isInTypeDef = child.kind === 2097152;
            const isInInterface = child.kind === 256;
            const isInNamespace = child.kind === 4;
            const isInFunction = !!child.signatures;

            const inKind = isInClass
                ? "class"
                : isInTypeDef
                ? "type"
                : isInFunction
                ? "function"
                : isInInterface
                ? "interface"
                : isInNamespace
                ? "namespace"
                : "";

            const stem =
                member.name === "constructor"
                    ? "<b><code>new " + child.name + "</code></b>"
                    : (member.flags.isStatic ? child.name : "") +
                      ".<b><code>" +
                      member.name +
                      "</code></b>";

            return member.signatures
                ?.map((signature) => {
                    return (
                        `<details>\n<summary>${stem}<code>(${(
                            signature?.parameters?.map(renderParamSimple) || []
                        ).join(", ")})</code> ${
                            member.inheritedFrom
                                ? "<sub><sup>from <code>" +
                                  member.inheritedFrom.name.split(".")[0] +
                                  "</code></sup></sub> "
                                : ""
                        } ${
                            signature?.comment
                                ? ""
                                : "<sub><sup>(undocumented)</sup></sub>"
                        }</summary>\n\n` +
                        ("```typescript\n" +
                            `${inKind} ${child.name}${
                                child.typeParameters
                                    ? `<${child.typeParameters
                                          .map((t) => t.name)
                                          .join(", ")}>`
                                    : ""
                            } {\n\n${indent(
                                `${member.name}${
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
                                                    param.flags.isOptional ||
                                                    param.defaultValue
                                                        ? "?"
                                                        : ""
                                                }: ${indentEnd(
                                                    renderType(param.type)
                                                )}${
                                                    param.defaultValue
                                                        ? ` = ${param.defaultValue}`
                                                        : ""
                                                }`
                                        ) || []
                                    ).join(",") +
                                    (signature.parameters?.length ? "\n" : "")
                                }): ${renderType(signature.type)} {...}`
                            )}\n\n}\n` +
                            "```\n" +
                            renderComment(signature.comment)) +
                        "</details>\n\n"
                    );
                })
                .join("\n\n");
        }

        function documentProperty(
            member: JSONOutput.DeclarationReflection,
            child: JSONOutput.DeclarationReflection
        ) {
            const isInClass = child.kind === 128;
            const isInTypeDef = child.kind === 2097152;
            const isInInterface = child.kind === 256;
            const isInNamespace = child.kind === 4;
            const isInFunction = !!child.signatures;

            const inKind = isInClass
                ? "class"
                : isInTypeDef
                ? "type"
                : isInFunction
                ? "function"
                : isInInterface
                ? "interface"
                : isInNamespace
                ? "namespace"
                : "";

            const stem = member.flags.isStatic ? child.name : "";
            return (
                `<details>\n<summary><code>${stem}.</code><b><code>${
                    member.name
                }</code></b> ${
                    member.inheritedFrom
                        ? "<sub><sup>from <code>" +
                          member.inheritedFrom.name.split(".")[0] +
                          "</code></sup></sub> "
                        : ""
                } ${
                    member.comment ? "" : "<sub><sup>(undocumented)</sup></sub>"
                }</summary>\n\n` +
                "```typescript\n" +
                `${inKind} ${child.name}${
                    child.typeParameters
                        ? `<${child.typeParameters
                              .map((t) => t.name)
                              .join(", ")}>`
                        : ""
                } {\n\n${indent(
                    `${member.getSignature ? "get " : ""}${member.name}${
                        member.getSignature ? "()" : ""
                    }: ${renderType(member.type || member.getSignature?.type)}${
                        member.getSignature ? " {...}" : ""
                    }`
                )}` +
                "\n\n}\n```\n" +
                renderComment(member.comment) +
                "</details>\n\n"
            );
        }
    });

    const docsContent = await readFile("./DOCS.md", "utf8");

    await writeFile(
        "./DOCS.md",
        docsContent.slice(
            0,
            docsContent.indexOf("<!-- AUTOGENERATED DOCS AFTER THIS POINT -->")
        ) +
            "<!-- AUTOGENERATED DOCS AFTER THIS POINT -->\n" +
            (await Promise.all(packageDocs)).join("\n\n\n")
    );
}

function indent(text: string): string {
    return text
        .split("\n")
        .map((line) => "  " + line)
        .join("\n");
}

function indentEnd(text: string): string {
    return text
        .split("\n")
        .map((line, i) => (i === 0 ? line : "  " + line))
        .join("\n");
}

main().catch(console.error);
