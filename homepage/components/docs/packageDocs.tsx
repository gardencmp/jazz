import { cn } from "@/lib/utils";
import JazzJSDocs from "../../../docsTmp/jazz-js.json";
import { Application, JSONOutput, ReflectionKind, SomeType } from "typedoc";

export const packages = {
    "jazz-js": JazzJSDocs as JSONOutput.ProjectReflection,
};

export function PackageDocs(props: { package: keyof typeof packages }) {
    const pkg = packages[props.package];

    return (
        <div className="not-prose">
            <h2>
                <code>{props.package}</code> API Reference
            </h2>
            {pkg.categories?.map((category) => (
                <Category
                    key={category.title}
                    category={category}
                    parent={pkg}
                    level={2}
                />
            ))}
        </div>
    );
}

export function Category({
    category,
    parent,
    level,
}: {
    category: JSONOutput.ReflectionCategory;
    parent: JSONOutput.ContainerReflection;
    level: number;
}) {
    const HElemem = `h${level}` as keyof JSX.IntrinsicElements;

    return (
        <>
            <HElemem
                className={cn("mt-6 mb-2 uppercase tracking-wide font-bold", {
                    "text-sm": level < 4,
                    "text-xs": level >= 4,
                })}
            >
                {category.title}
            </HElemem>
            <div className={level > 2 ? "flex flex-col gap-2 items-start" : ""}>
                {category.children?.map((childId) => (
                    <Item
                        key={childId}
                        item={parent.children?.find(
                            (child) => child.id == childId
                        )}
                        level={level + 1}
                        parent={parent.name}
                    />
                ))}
            </div>
        </>
    );
}

export function Item({
    item,
    level,
    parent,
}: {
    item?: JSONOutput.DeclarationReflection;
    level: number;
    parent: string | undefined;
}) {
    if (!item) return null;

    const HElemem = `h${level}` as keyof JSX.IntrinsicElements;

    return (
        <div
            className={cn(
                "relative",
                level < 4
                    ? "border border-neutral-500/30 rounded-xl py-2 px-3 mb-2 mt-2"
                    : [
                          "group px-2 py-1 bg-stone-500/10 rounded text-sm focus:text-base target:text-base hover:outline focus:outline target:outline cursor-pointer focus:cursor-auto target:cursor-auto",
                          "target:before:h-20 target:before:block target:before:-mt-20",
                      ]
            )}
            tabIndex={0}
            id={parent ? parent + "." + item.name : item.name}
        >
            <HElemem className={level < 4 ? "mb-2 mt-0" : ""}>
                <code className="">
                    <ItemName item={item} />
                </code>
            </HElemem>
            <div
                className={cn(
                    level >= 4 && [
                        // "max-h-0 group-hover:max-h-[30dvh] group-focus:max-h-[30dvh] max-w-0 group-hover:max-w-[80dvw] group-focus:max-w-[80dvw]",
                        "max-h-0 group-target:max-h-[30dvh] group-focus:max-h-[30dvh] max-w-0 group-target:max-w-[80dvw] group-focus:max-w-[80dvw]",
                        "overflow-y-hidden hover:overflow-y-scroll overflow-x-scroll",
                    ]
                )}
            >
                <div className={cn("text-sm border border-stone-200 p-2 mb-4")}>
                    <RenderReflectionHeader reflection={item} parent={parent} />
                </div>
                <ItemComment comment={item.comment} />
                <hr />
            </div>
            {item.categories?.map((category) => (
                <Category
                    key={category.title}
                    category={category}
                    level={level + 1}
                    parent={item}
                />
            ))}
        </div>
    );
}

export function ItemName({ item }: { item: JSONOutput.DeclarationReflection }) {
    if (item.signatures) {
        if (
            item.signatures[0].type?.type === "reference" &&
            item.signatures[0].type.qualifiedName === "React.JSX.Element"
        ) {
            return `<${item.name}/>`;
        } else {
            return (
                <>
                    {item.name}(
                    <span className="opacity-75 text-[0.9em]">
                        {(item.signatures[0].parameters || [])
                            .map(renderParamSimple)
                            .join(", ")}
                    </span>
                    ):{" "}
                    <span className="opacity-75 text-[0.9em]">
                        <RenderType type={item.signatures[0].type} />
                    </span>
                </>
            );
        }
    } else {
        return (
            <>
                {item.name}
                {item.typeParameters && (
                    <span className="opacity-75 text-[0.9em]">
                        {`<${item.typeParameters
                            .map((param) => param.name)
                            .join(", ")}>`}
                    </span>
                )}
            </>
        );
    }
}

function ItemComment({ comment }: { comment?: JSONOutput.Comment }) {
    if (!comment) return null;

    return (
        <div className="mb-2">
            <CommentDisplayParts parts={comment.summary} />
            {comment.blockTags?.map((tag, i) => (
                <div key={i}>
                    {tag.tag} <CommentDisplayParts parts={tag.content} />
                </div>
            ))}
        </div>
    );
}

function RenderReflectionHeader({
    reflection,
    parent,
}: {
    reflection: JSONOutput.DeclarationReflection;
    parent: String | undefined;
}) {
    if (
        reflection.kind === ReflectionKind.Class ||
        reflection.kind === ReflectionKind.Interface
    ) {
        const kind =
            reflection.kind === ReflectionKind.Class ? "class" : "interface";
        return (
            <code>
                {kind} {reflection.name}
                {reflection.typeParameters && (
                    <span className="opacity-75 text-[0.9em]">
                        {"<"}
                        {reflection.typeParameters.map((param) => (
                            <>
                                {param.name} extends{" "}
                                <RenderType type={param.type} />
                            </>
                        ))}
                        {">"}
                    </span>
                )}
                {reflection.extendedTypes && (
                    <>
                        {" "}
                        <br />
                        &nbsp;&nbsp;extends{" "}
                        <span className="opacity-75 text-[0.9em]">
                            {" "}
                            {reflection.extendedTypes.map((type, i) => (
                                <>
                                    <RenderType type={type} />
                                    {i === reflection.extendedTypes!.length - 1
                                        ? ""
                                        : ", "}
                                </>
                            ))}
                        </span>
                    </>
                )}
                {reflection.implementedTypes && (
                    <>
                        {" "}
                        implements{" "}
                        <span className="opacity-75 text-[0.9em]">
                            {" "}
                            {reflection.implementedTypes.map((type, i) => (
                                <>
                                    <RenderType type={type} />
                                    {i ===
                                    reflection.implementedTypes!.length - 1
                                        ? ""
                                        : ", "}
                                </>
                            ))}
                        </span>
                    </>
                )}
                {" { ... }"}
            </code>
        );
    } else if (reflection.kind === ReflectionKind.Namespace) {
        return (
            <code>
                namespace {reflection.name} {" { ... }"}
            </code>
        );
    } else if (reflection.kind & ReflectionKind.VariableOrProperty) {
        const prefix =
            reflection.kind === ReflectionKind.Property ? (
                <span className="opacity-75 text-[0.9em]">
                    {parent
                        ? parent[0].toLowerCase() + parent.slice(1)
                        : "this"}
                    .
                </span>
            ) : reflection.flags.isConst ? (
                "const "
            ) : (
                "let "
            );

        return (
            <code>
                {prefix}
                {reflection.name}: <RenderType type={reflection.type} />
            </code>
        );
    } else if (reflection.kind === ReflectionKind.TypeAlias) {
        return (
            <code>
                type {reflection.name}
                {reflection.typeParameters && (
                    <span className="opacity-75 text-[0.9em]">
                        {"<"}
                        {reflection.typeParameters.map((param) => (
                            <>
                                {param.name} extends{" "}
                                <RenderType type={param.type} />
                            </>
                        ))}
                        {">"}
                    </span>
                )}
                {" = "}
                <RenderType type={reflection.type} />
            </code>
        );
    } else if (
        reflection.kind & ReflectionKind.FunctionOrMethod ||
        reflection.kind === ReflectionKind.Constructor
    ) {
        const prefix =
            reflection.kind === ReflectionKind.Function ? (
                "function "
            ) : reflection.kind === ReflectionKind.Constructor ? (
                "new " + parent
            ) : (
                <span className="opacity-75 text-[0.9em]">
                    {parent
                        ? parent[0].toLowerCase() + parent.slice(1)
                        : "this"}
                    .
                </span>
            );
        return (
            <code>
                {prefix}
                {reflection.kind !== ReflectionKind.Constructor &&
                    reflection.name}
                {reflection.signatures?.map((signature, i) => (
                    <>
                        (
                        <span className="opacity-75 text-[0.9em]">
                            {signature.parameters?.map((param, i) => {
                                const rendered =
                                    param.name === "__namedParameters" &&
                                    param.type?.type === "reflection" ? (
                                        <RenderType key={i} type={param.type} />
                                    ) : (
                                        <>
                                            {param.name}
                                            {param.flags.isOptional ||
                                            param.defaultValue
                                                ? "?"
                                                : ""}
                                            :{" "}
                                            <RenderType
                                                key={i}
                                                type={param.type}
                                            />
                                        </>
                                    );
                                return (
                                    <>
                                        {rendered}
                                        {i ===
                                        (signature.parameters?.length || 1) - 1
                                            ? ""
                                            : ", "}
                                    </>
                                );
                            })}
                        </span>
                        ):{" "}
                        <span className="opacity-75 text-[0.9em]">
                            <RenderType type={signature.type} />
                        </span>
                        {i === reflection.signatures!.length - 1 ? "" : ", "}
                    </>
                ))}
                {" { ... }"}
            </code>
        );
    } else {
        return (
            <pre className="text-xs leading-3">
                <code>
                    Unknown reflection type:{" "}
                    {JSON.stringify(reflection, undefined, "  ")}
                </code>
            </pre>
        );
    }
}

function RenderType({ type }: { type?: JSONOutput.SomeType }) {
    if (!type) return null;

    if (type.type === "intrinsic") {
        return type.name;
    } else if (type.type === "literal") {
        return JSON.stringify(type.value);
    } else if (type.type === "reference") {
        return (
            <>
                {type.name}
                {type.typeArguments && (
                    <span className="opacity-75 text-[0.9em]">
                        {`<`}
                        {type.typeArguments.map((arg, i) => (
                            <>
                                <RenderType key={i} type={arg} />
                                {i === type.typeArguments!.length - 1
                                    ? ""
                                    : ", "}
                            </>
                        ))}
                        {`>`}
                    </span>
                )}
            </>
        );
    } else if (type.type === "array") {
        return (
            <>
                <RenderType type={type.elementType} />
                {`[]`}
            </>
        );
    } else if (type.type === "tuple") {
        return (
            <>
                {`[`}
                {type.elements?.map((element, i) => (
                    <>
                        <RenderType key={i} type={element} />
                        {i === type.elements!.length - 1 ? "" : ", "}
                    </>
                ))}
                {`]`}
            </>
        );
    } else if (type.type === "union") {
        const members = type.types;
        // sort so undefined is always last
        members.sort((a, b) => {
            if (a.type === "intrinsic" && a.name === "undefined") {
                return 1;
            } else if (b.type === "intrinsic" && b.name === "undefined") {
                return -1;
            } else {
                return 0;
            }
        });
        return (
            <>
                {members.map((member, i) => (
                    <>
                        <RenderType key={i} type={member} />
                        {i === members.length - 1 ? "" : " | "}
                    </>
                ))}
            </>
        );
    } else if (type.type === "indexedAccess") {
        return (
            <>
                <RenderType type={type.objectType} />
                {`[`}
                <RenderType type={type.indexType} />
                {`]`}
            </>
        );
    } else if (type.type === "predicate") {
        return (
            <>
                {type.name} <span className="italic">is</span>{" "}
                <RenderType type={type.targetType} />
            </>
        );
    } else if (type.type === "intersection") {
        return (
            <>
                {type.types.map((member, i) => (
                    <>
                        <RenderType key={i} type={member} />
                        {i === type.types.length - 1 ? "" : " & "}
                    </>
                ))}
            </>
        );
    } else if (type.type === "mapped") {
        return (
            <span>
                {`{`}
                <br />
                <span className="ml-4 flex items-start">
                    {`[`}
                    {type.parameter}
                    {" in "}
                    <RenderType type={type.parameterType} />
                    {`]`}
                    {/* {type.optional ? "?" : ""} */}
                    {`:`}&nbsp;
                    <RenderType type={type.templateType} />
                </span>
                <br />
                {`}`}
            </span>
        );
    } else if (type.type === "typeOperator") {
        if (type.operator === "keyof") {
            return (
                <>
                    {`keyof `}
                    <RenderType type={type.target} />
                </>
            );
        } else {
            return (
                <pre className="text-xs leading-3">
                    <code>
                        Unknown type operator:{" "}
                        {JSON.stringify(type, undefined, "  ")}
                    </code>
                </pre>
            );
        }
    } else if (type.type === "conditional") {
        return (
            <span className="inline-block">
                <RenderType type={type.checkType} />
                {` extends `}
                <RenderType type={type.extendsType} />
                <span>
                    {` ? `}
                    <RenderType type={type.trueType} />
                </span>
                <span>
                    {` : `}
                    <RenderType type={type.falseType} />
                </span>
            </span>
        );
    } else if (type.type === "inferred") {
        return (
            <>
                <span className="italic">infer</span> {type.name}{" "}
                {type.constraint && "TODO: contsraint"}
            </>
        );
    } else if (type.type === "reflection") {
        if (type.declaration.kind === ReflectionKind.TypeLiteral) {
            return (
                <span>
                    {`{`}
                    {!!type.declaration.children?.length && <br />}
                    {type.declaration.children?.map((child, i) => (
                        <span key={i} className="ml-4">
                            {child.name}
                            {": "}
                            <RenderType type={child.type} />
                            {i === type.declaration.children!.length - 1
                                ? ""
                                : ", "}
                            <br />
                        </span>
                    ))}
                    {`}`}
                </span>
            );
        } else {
            return (
                <pre className="text-xs leading-3">
                    <code>
                        Unknown reflection type:{" "}
                        {JSON.stringify(type, undefined, "  ")}
                    </code>
                </pre>
            );
        }
    } else if (type.type === "templateLiteral") {
        return (
            <>
                {`"`}
                {type.head}
                {type.tail.map((tail, i) => (
                    <>
                        {"${"}
                        <RenderType type={tail[0]} />
                        {"}"}
                        {tail[1]}
                    </>
                ))}
                {`"`}
            </>
        );
    } else {
        return (
            <pre className="text-xs leading-3">
                <code>
                    Unknown type: {JSON.stringify(type, undefined, "  ")}
                </code>
            </pre>
        );
    }
}

function CommentDisplayParts({
    parts,
}: {
    parts: JSONOutput.CommentDisplayPart[];
}) {
    return parts.map((part, i) => {
        if (part.kind === "text") {
            return <span key={i}>{part.text}</span>;
        } else if (part.kind === "code") {
            return <code key={i}>{part.text}</code>;
        } else {
            return <div key={i}>{JSON.stringify(part)}</div>;
        }
    });
}

function renderParamSimple(param: JSONOutput.ParameterReflection) {
    return param.name === "__namedParameters" &&
        param.type?.type === "reflection"
        ? `{${param.type?.declaration.children
              ?.map((child) => child.name + (child.flags.isOptional ? "?" : ""))
              .join(", ")}}${
              param.flags.isOptional || param.defaultValue ? "?" : ""
          }`
        : param.name +
              (param.flags.isOptional || param.defaultValue ? "?" : "");
}
