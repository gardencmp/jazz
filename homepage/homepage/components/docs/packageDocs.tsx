import {
    CommentDisplayPart,
    DeclarationReflection,
    ReflectionKind,
    SignatureReflection,
    SomeType,
    TypeContext,
} from "typedoc";
import {
    ClassOrInterface,
    FnDecl,
    Highlight,
    PropCategory,
    PropDecl,
} from "./tags";
import { requestProject } from "./requestProject";
import { PackageIcon, Type } from "lucide-react";

export async function PackageDocs({
    package: packageName,
}: {
    package: string;
}) {
    let project = await requestProject(packageName);

    // console.dir(project, {depth: 10});

    return (
        <>
            <h2 className="flex items-center gap-2">
                <code>{packageName}</code> <PackageIcon />
            </h2>
            {project.categories?.map((category) => {
                return (
                    <section key={category.title}>
                        <h3>{category.title}</h3>
                        {category.children.map((child) => (
                            <RenderPackageChild
                                child={child}
                                key={child.id}
                                inPackage={packageName}
                            />
                        ))}
                    </section>
                );
            })}
        </>
    );
}

function RenderPackageChild({
    child,
    inPackage,
}: {
    child: DeclarationReflection;
    inPackage: string;
}) {
    if (
        child.kind === ReflectionKind.Class ||
        child.kind === ReflectionKind.Interface
    ) {
        return (
            <RenderClassOrInterface
                classOrInterface={child}
                inPackage={inPackage}
            />
        );
    } else if (child.kind === ReflectionKind.TypeAlias) {
        return (
            <>
                <h4 className="not-prose">
                    <Highlight>{`type ${child.name}`}</Highlight>
                </h4>
                <p className="not-prose text-sm ml-4">
                    <Highlight>{`type ${child.name} = ${
                        child.type?.toString() || "NO TYPE"
                    }`}</Highlight>
                </p>
            </>
        );
    } else {
        return (
            <h4>
                {child.name} {child.type?.type}
            </h4>
        );
    }
}

function RenderClassOrInterface({
    inPackage,
    classOrInterface: classOrInterface,
}: {
    inPackage: string;
    classOrInterface: DeclarationReflection;
}) {
    const commentSummary = classOrInterface.comment?.summary;
    return (
        <ClassOrInterface
            inPackage={inPackage}
            name={classOrInterface.name}
            doc={renderSummary(commentSummary)}
            isInterface={classOrInterface.kind === ReflectionKind.Interface}
        >
            {classOrInterface.categories?.map((category) => (
                <div key={category.title}>
                    <PropCategory
                        name={category.title}
                        description={renderSummary(
                            category.description?.filter(
                                (p) =>
                                    p.kind !== "code" ||
                                    !p.text.startsWith("```")
                            )
                        )}
                        example={renderSummary(
                            category.description?.filter(
                                (p) =>
                                    p.kind === "code" &&
                                    p.text.startsWith("```")
                            )
                        )}
                    />
                    {category.children.map((prop) => (
                        <RenderProp
                            prop={prop}
                            klass={classOrInterface}
                            key={prop.id}
                        />
                    ))}
                </div>
            ))}
        </ClassOrInterface>
    );
}

function renderSummary(commentSummary: CommentDisplayPart[] | undefined) {
    return commentSummary?.map((part) =>
        part.kind === "text" ? (
            <span>{part.text}</span>
        ) : part.kind === "inline-tag" ? (
            <code>
                {part.tag} {part.text}
            </code>
        ) : part.text.startsWith("```") ? (
            <pre className="text-xs mt-4">
                <code>
                    <Highlight>
                        {part.text.split("\n").slice(1, -1).join("\n")}
                    </Highlight>
                </code>
            </pre>
        ) : (
            <code>
                <Highlight>{part.text.slice(1, -1)}</Highlight>
            </code>
        )
    );
}

function RenderProp({
    prop,
    klass,
}: {
    prop: DeclarationReflection;
    klass: DeclarationReflection;
}) {
    const propOrGetSig = prop.getSignature ? prop.getSignature : prop;
    return prop.kind & ReflectionKind.FunctionOrMethod ? (
        prop
            .getAllSignatures()
            .map((signature) => (
                <FnDecl
                    key={signature.id}
                    signature={`${prop.flags.isStatic ? klass.name : ""}.${
                        prop.name
                    }${
                        signature.typeParameters?.length
                            ? "<" +
                              signature.typeParameters
                                  .map((tParam) => tParam.name)
                                  .join(", ") +
                              ">"
                            : ""
                    }(${printParams(signature)?.join(", ")})`}
                    paramTypes={printParamsWithTypes(signature).join("\n")}
                    returnType={printType(signature.type)}
                    doc="TODO"
                />
            ))
    ) : (
        <PropDecl
            name={
                (prop.flags.isStatic ? klass.name : "") +
                (prop.name.startsWith("[") ? "" : ".") +
                prop.name
            }
            type={printType(propOrGetSig.type)}
            doc={
                propOrGetSig.comment &&
                renderSummary(propOrGetSig.comment.summary)
            }
            example={renderSummary(
                propOrGetSig.comment?.getTag("@example")?.content
            )}
        />
    );
}

function printParams(signature: SignatureReflection) {
    return (
        signature.parameters?.map(
            (param) => param.name + (param.defaultValue ? "?" : "")
        ) || []
    );
}

function printParamsWithTypes(signature: SignatureReflection) {
    return (
        signature.parameters?.map(
            (param) =>
                param.name +
                (param.defaultValue ? "?" : "") +
                ": " +
                printType(param.type)
        ) || []
    );
}

function printType(type: SomeType | undefined): string {
    if (!type) return "NO TYPE";
    if (type.type === "reflection") {
        if (type.declaration.kind === ReflectionKind.TypeLiteral) {
            if (type.declaration.signatures?.length) {
                return (
                    type.declaration.signatures
                        ?.map(
                            (sig) =>
                                `(${printParamsWithTypes(sig).join(
                                    ", "
                                )}) => ${printType(sig.type)}`
                        )
                        .join(" | ") || ""
                );
            } else {
                return (
                    "{ " +
                    type.declaration.children
                        ?.map(
                            (child) => `${child.name}: ${printType(child.type)}`
                        )
                        .join(", ") +
                    " }"
                );
            }
        }
        return "TODO reflection type " + type.declaration.kind;
    } else if (type.type === "reference") {
        return (
            type.name +
            (type.typeArguments?.length
                ? "<" + type.typeArguments.map(printType).join(", ") + ">"
                : "")
        );
    } else if (type.type === "intersection") {
        return (
            type.types
                ?.map((part) =>
                    part.needsParenthesis(TypeContext["intersectionElement"])
                        ? `(${printType(part)})`
                        : printType(part)
                )
                .join(" & ") || "NO TYPES"
        );
    } else if (type.type === "union") {
        return (
            type.types
                .sort((a, b) => (a.type === "intrinsic" ? 1 : -1))
                ?.map((part) =>
                    part.needsParenthesis(TypeContext["unionElement"])
                        ? `(${printType(part)})`
                        : printType(part)
                )
                .join(" | ") || "NO TYPES"
        );
    } else if (type.type === "array") {
        if (type.needsParenthesis()) {
            return `(${printType(type.elementType)})[]`;
        } else {
            return printType(type.elementType) + "[]";
        }
    } else if (type.type === "mapped") {
        return `{[${type.parameter} in ${printType(
            type.parameterType
        )}]: ${printType(type.templateType)}}`;
    } else if (type.type === "indexedAccess") {
        return `${printType(type.objectType)}[${printType(type.indexType)}]`;
    } else if (type.type === "intrinsic") {
        return type.name;
    } else if (type.type === "predicate") {
        return `${type.name} is ${printType(type.targetType)}`;
    } else if (type.type === "query") {
        return printType(type.queryType);
    } else if (type.type === "literal") {
        return JSON.stringify(type.value);
    } else {
        return "TODO type " + type.type;
    }
}
