import { readFile, writeFile } from "fs/promises";
import { Application, JSONOutput, ReflectionKind } from "typedoc";
import { manuallyIgnore, indentEnd, indent } from "./generateDocs";

export async function genDocsMd() {
    const packageDocs = Object.entries({
        // "jazz-react": "index.tsx",
        // cojson: "index.ts",
        // "jazz-browser": "index.ts",
        // "jazz-browser-media-images": "index.ts",
        // "jazz-autosub": "index.ts",
        // "jazz-nodejs": "index.ts",
        "jazz-tools": "index.ts",
    }).map(async ([packageName, entryPoint]) => {
        const app = await Application.bootstrapWithPlugins({
            entryPoints: [`packages/${packageName}/src/${entryPoint}`],
            tsconfig: `packages/${packageName}/tsconfig.json`,
            sort: ["required-first"],
            groupOrder: ["Functions", "Classes", "TypeAliases", "Namespaces"],
            categorizeByGroup: false,
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
                        ?.flatMap((childId) => {
                            const child = docs.children!.find(
                                (child) => child.id === childId
                            )!;

                            if (manuallyIgnore.has(child.name) ||
                                child.comment?.blockTags?.some(
                                    (tag) => tag.tag === "@deprecated" ||
                                        tag.tag === "@internal" ||
                                        tag.tag === "@ignore"
                                ) ||
                                child.signatures?.every((signature) => signature.comment?.blockTags?.some(
                                    (tag) => tag.tag === "@deprecated" ||
                                        tag.tag === "@internal" ||
                                        tag.tag === "@ignore"
                                )
                                )) {
                                return [];
                            }

                            return (
                                `## \`${renderChildName(
                                    child
                                )}\`\n\n<sup>(${group.title
                                    .toLowerCase()
                                    .replace("bles", "ble")
                                    .replace("ces", "ce")
                                    .replace(/es$/, "")
                                    .replace(
                                        "ns",
                                        "n"
                                    )} in \`${packageName}\`)</sup>\n\n` +
                                renderChildType(child) +
                                (child.kind === ReflectionKind.Class ||
                                    child.kind === ReflectionKind.Interface ||
                                    child.kind === ReflectionKind.Namespace
                                    ? renderSummary(child.comment) +
                                    renderExamples(child.comment) +
                                    (child.categories || child.groups)
                                        ?.map((category) => renderChildCategory(
                                            child,
                                            category
                                        )
                                        )
                                        .join("<br/>\n\n")
                                    : child.kind === ReflectionKind.Function
                                        ? renderSummary(
                                            child.signatures?.[0].comment
                                        ) +
                                        renderParamComments(
                                            child.signatures?.[0].parameters || []
                                        ) +
                                        renderExamples(
                                            child.signatures?.[0].comment
                                        ) +
                                        "\n\n"
                                        : "TODO: doc generator not implemented yet " +
                                        child.kind)
                            );
                        })
                        .join("\n\n----\n\n");
                })
                .join("\n\n----\n\n")
        );

        function renderSummary(comment?: JSONOutput.Comment): string {
            if (comment) {
                return (
                    comment.summary
                        .map((token) => token.kind === "text" || token.kind === "code"
                            ? token.text
                            : ""
                        )
                        .join("") +
                    "\n\n" +
                    "\n\n"
                );
            } else {
                return "TODO: document\n\n";
            }
        }

        function renderExamples(comment?: JSONOutput.Comment): string {
            return (comment?.blockTags || [])
                .map((blockTag) => blockTag.tag === "@example"
                    ? "##### Example:\n\n" +
                    blockTag.content
                        .map((token) => token.kind === "text" || token.kind === "code"
                            ? token.text
                            : ""
                        )
                        .join("") +
                    "\n\n"
                    : ""
                )
                .join("");
        }

        function renderParamComments(params: JSONOutput.ParameterReflection[]) {
            const paramDocs = params.flatMap((param) => {
                if (param.type?.type === "reflection") {
                    return param.type.declaration.children?.flatMap((child) => {
                        if (child.name === "children" &&
                            child.type?.type === "reference" &&
                            child.type?.name === "ReactNode") {
                            return [];
                        }
                        return (
                            `| \`${param.name}.${child.name}${child.flags.isOptional || child.defaultValue
                                ? "?"
                                : ""}\` | ` +
                            (child.comment
                                ? child.comment.summary
                                    .map((token) => token.kind === "text" ||
                                        token.kind === "code"
                                        ? token.text
                                        : ""
                                    )
                                    .join("")
                                : "TODO: document") +
                            " |"
                        );
                    });
                } else {
                    const comment = param.comment;
                    return [
                        `| \`${param.name}${param.flags.isOptional || param.defaultValue
                            ? "?"
                            : ""}\` | ` +
                        (comment
                            ? comment.summary
                                .map((token) => token.kind === "text" ||
                                    token.kind === "code"
                                    ? token.text
                                    : ""
                                )
                                .join("")
                            : "TODO: document ") +
                        " |",
                    ];
                }
            });

            if (paramDocs.length) {
                return `### Parameters:\n\n| name | description |\n| ----: | ---- |\n${paramDocs.join(
                    "\n"
                )}\n\n`;
            }
        }

        function renderChildName(child: JSONOutput.DeclarationReflection) {
            if (child.signatures) {
                if (child.signatures[0].type?.type === "reference" &&
                    child.signatures[0].type.qualifiedName ===
                    "React.JSX.Element") {
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
            const isClass = child.kind === ReflectionKind.Class;
            const isTypeAlias = child.kind === ReflectionKind.TypeAlias;
            const isInterface = child.kind === ReflectionKind.Interface;
            const isNamespace = child.kind === ReflectionKind.Namespace;
            const isFunction = !!child.signatures;

            const kind = isClass
                ? "class"
                : isTypeAlias
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
                (child.typeParameters || child.signatures?.[0].typeParameter
                    ? "<" +
                    (
                        child.typeParameters ||
                        child.signatures?.[0].typeParameter ||
                        []
                    )
                        .map(renderTypeParam)
                        .join(", ") +
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
                    : isTypeAlias
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

        function renderChildCategory(
            child: JSONOutput.DeclarationReflection,
            category: JSONOutput.ReflectionGroup
        ): string {
            return (
                `### \`${child.name}\`: ${category.title.replace(
                    /[^d]+\./,
                    ""
                )}\n\n` +
                category.children
                    ?.map((memberId) => {
                        const member = child.children!.find(
                            (member) => member.id === memberId
                        )!;

                        if (member.kind === 2048 || member.kind === 512) {
                            if (member.signatures?.every(
                                (sig) => sig.comment?.modifierTags?.includes(
                                    "@internal"
                                ) ||
                                    sig.comment?.modifierTags?.includes(
                                        "@deprecated"
                                    )
                            )) {
                                return "";
                            } else {
                                return documentConstructorOrMethod(
                                    member,
                                    child
                                );
                            }
                        } else if (member.kind === 1024 ||
                            member.kind === 262144) {
                            if (member.comment?.modifierTags?.includes(
                                "@internal"
                            ) ||
                                member.comment?.modifierTags?.includes(
                                    "@deprecated"
                                )) {
                                return "";
                            } else {
                                return documentProperty(member, child);
                            }
                        } else if (member.kind === 2097152) {
                            if (member.comment?.modifierTags?.includes(
                                "@internal"
                            ) ||
                                member.comment?.modifierTags?.includes(
                                    "@deprecated"
                                )) {
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
                const seen = new Set<string>();
                return t.types
                    .flatMap((t) => {
                        const rendered = t.type === "intersection" || t.type === "union"
                            ? `(${renderType(t)})`
                            : renderType(t);

                        if (seen.has(rendered)) {
                            return [];
                        } else {
                            seen.add(rendered);
                            return [rendered];
                        }
                    })
                    .join(" | ");
            } else if (t.type === "intersection") {
                const seen = new Set<string>();
                return t.types
                    .flatMap((t) => {
                        const rendered = t.type === "intersection" || t.type === "union"
                            ? `(${renderType(t)})`
                            : renderType(t);

                        if (seen.has(rendered)) {
                            return [];
                        } else {
                            seen.add(rendered);
                            return [rendered];
                        }
                    })
                    .join(" & ");
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
                        `{${t.declaration.children
                            ? t.declaration.children
                                .map(
                                    (child) => `  ${child.name}${child.flags.isOptional
                                            ? "?"
                                            : ""}: ${indentEnd(
                                                renderType(child.type)
                                            )},`
                                )
                                .join("\n")
                            : ""}\n  [` +
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
                        .map((child) => child.signatures
                            ? child.signatures
                                .map(
                                    (signature) => `  ${child.name}(${signature.parameters
                                            ? "\n  " +
                                            indent(
                                                signature.parameters
                                                    .map((p) => indentEnd(
                                                        renderParam(
                                                            p
                                                        )
                                                    )
                                                    )
                                                    .join(",\n  ")
                                            ) +
                                            "\n  )"
                                            : "()"}: ${indentEnd(
                                                renderType(signature.type)
                                            )}`
                                )
                                .join("\n") + ",\n"
                            : `  ${child.name}${child.flags.isOptional ? "?" : ""}: ${indentEnd(renderType(child.type))},\n`
                        )
                        .join("")}}`;
                } else if (t.declaration.signatures) {
                    return t.declaration.signatures
                        .map(
                            (signature) => `(${(signature.parameters || [])
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
                    (child) => child.variant === "declaration" &&
                        child.type?.type === "templateLiteral" &&
                        child.type.head === t.head &&
                        child.type.tail.every(
                            (piece, i) => piece[1] === t.tail[i][1]
                        )
                );

                if (matchingNamedType) {
                    return matchingNamedType.name;
                } else {
                    if (t.head === "sealerSecret_z" &&
                        t.tail[0][1] === "/signerSecret_z") {
                        return "AgentSecret";
                    } else if (t.head === "sealer_z" &&
                        t.tail[0][1] === "/signer_z") {
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
                                    (bit) => "${" + renderType(bit[0]) + "}" + bit[1]
                                )
                                .join("") +
                            "`"
                        );
                    }
                }
            } else if (t.type === "conditional") {
                const trueRendered = renderType(t.trueType);
                const falseRendered = renderType(t.falseType);

                if (trueRendered.includes("\n") ||
                    falseRendered.includes("\n")) {
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
                        (child) => child.name + (child.flags.isOptional ? "?" : "")
                    )
                    .join(", ")}}${param.flags.isOptional || param.defaultValue ? "?" : ""}`
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

            const stem = member.name === "constructor"
                ? "new " + child.name + "</code></b>"
                : (member.flags.isStatic ? child.name : "") +
                "." +
                member.name +
                "";

            return member.signatures
                ?.map((signature) => {
                    return (
                        `<details>\n<summary><b><code>${stem}(${(
                            signature?.parameters?.map(renderParamSimple) || []
                        ).join(", ")})</code></b> ${member.inheritedFrom
                            ? "<sub><sup>from <code>" +
                            member.inheritedFrom.name.split(".")[0] +
                            "</code></sup></sub> "
                            : ""} ${signature?.comment
                            ? ""
                            : "<sub><sup>(undocumented)</sup></sub>"}</summary>\n\n` +
                        ("```typescript\n" +
                            `${inKind} ${child.name}${child.typeParameters
                                ? `<${child.typeParameters
                                    .map((t) => t.name)
                                    .join(", ")}>`
                                : ""} {\n\n${indent(
                                    `${member.name}${signature.typeParameter
                                        ? `<${signature.typeParameter
                                            .map(renderTypeParam)
                                            .join(", ")}>`
                                        : ""}(${(
                                        signature.parameters?.map(
                                            (param) => `\n  ${param.name}${param.flags.isOptional ||
                                                    param.defaultValue
                                                    ? "?"
                                                    : ""}: ${indentEnd(
                                                        renderType(param.type)
                                                    )}${param.defaultValue
                                                    ? ` = ${param.defaultValue}`
                                                    : ""}`
                                        ) || []
                                    ).join(",") +
                                    (signature.parameters?.length ? "\n" : "")}): ${renderType(signature.type)} {...}`
                                )}\n\n}\n` +
                            "```\n" +
                            renderSummary(signature.comment)) +
                        renderParamComments(signature.parameters || []) +
                        renderExamples(signature.comment) +
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
                `<details>\n<summary><b><code>${stem}.${member.name}</code></b> ${member.inheritedFrom
                    ? "<sub><sup>from <code>" +
                    member.inheritedFrom.name.split(".")[0] +
                    "</code></sup></sub> "
                    : ""} ${member.comment ? "" : "<sub><sup>(undocumented)</sup></sub>"}</summary>\n\n` +
                "```typescript\n" +
                `${inKind} ${child.name}${child.typeParameters
                    ? `<${child.typeParameters
                        .map((t) => t.name)
                        .join(", ")}>`
                    : ""} {\n\n${indent(
                        `${member.getSignature ? "get " : ""}${member.name}${member.getSignature ? "()" : ""}: ${renderType(member.type || member.getSignature?.type)}${member.getSignature ? " {...}" : ""}`
                    )}` +
                "\n\n}\n```\n" +
                renderSummary(member.comment) +
                renderExamples(member.comment) +
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
