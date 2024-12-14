import { Icon } from "gcmp-design-system/src/app/components/atoms/Icon";
import {
  CommentDisplayPart,
  DeclarationReflection,
  ReflectionKind,
  SignatureReflection,
  SomeType,
  TypeContext,
  TypeParameterReflection,
} from "typedoc";
import { requestProject } from "./requestProject";
import {
  ClassOrInterface,
  DocComment,
  FnDecl,
  Highlight,
  PropCategory,
  PropDecl,
} from "./tags";

export async function PackageDocs({
  package: packageName,
}: {
  package: string;
}) {
  let project = await requestProject(packageName as any);

  // console.dir(project, {depth: 10});

  return (
    <>
      <h2 className="flex items-center gap-2">
        <code>{packageName}</code> <Icon name="package" size="md" />
      </h2>
      {project.categories?.map((category) => {
        return (
          <section key={category.title}>
            <h2>{category.title}</h2>
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
      <RenderClassOrInterface classOrInterface={child} inPackage={inPackage} />
    );
  } else if (child.kind === ReflectionKind.TypeAlias) {
    return <RenderTypeAlias inPackage={inPackage} child={child} />;
  } else if (child.kind === ReflectionKind.Function) {
    return child.getAllSignatures().map((signature, i) => {
      const paramTypes = printParamsWithTypes(signature);
      return (
        <div
          key={i}
          id={child.name}
          className="not-prose mt-4 p-3 rounded bg-stone-50 dark:bg-stone-925"
        >
          {
            <Highlight hide={[0, 2]}>
              {`function \n${printSimpleSignature(child, signature) + ":"}\n {}`}
            </Highlight>
          }{" "}
          <span className="opacity-75 text-xs pl-1">
            <Highlight>{printType(signature.type)}</Highlight>
          </span>
          <div className="ml-4 mt-0 text-xs opacity-75 flex">
            {paramTypes.length > 0 && (
              <div>
                <Highlight
                  hide={[0, 1 + paramTypes.length]}
                >{`function fn(...args: [\n${paramTypes.join(
                  ",\n",
                )}\n]) {}`}</Highlight>
              </div>
            )}
          </div>
        </div>
      );
    });
  } else {
    return (
      <h3 id={child.name}>
        {child.name} {child.type?.type}
      </h3>
    );
  }
}

function RenderTypeAlias({
  inPackage,
  child,
}: {
  inPackage: string;
  child: DeclarationReflection;
}) {
  const typeParameters = child.typeParameters?.map(
    (tParam) =>
      tParam.name + (tParam.type ? ` extends ${printType(tParam.type)}` : ""),
  );
  return (
    <div className="mt-4">
      <h3 className="not-prose" id={child.name}>
        <Highlight>{`type ${child.name}`}</Highlight>
      </h3>
      <p className="not-prose text-sm ml-4">
        <Highlight>{`type ${child.name}${typeParameters?.length && `<${typeParameters?.join(", ")}>`} = ${printType(
          child.type,
        )}`}</Highlight>
      </p>
      <div className="ml-4 mt-2 flex-[3]">
        <DocComment>
          {child.comment
            ? renderSummary(child.comment.summary)
            : "⚠️ undocumented"}
        </DocComment>
      </div>
    </div>
  );
}

function RenderClassOrInterface({
  inPackage,
  classOrInterface: classOrInterface,
}: {
  inPackage: string;
  classOrInterface: DeclarationReflection;
}) {
  const commentSummary = classOrInterface.comment?.summary;
  const typeParamsWithConstraints = printTypeParamsWithConstraints(
    classOrInterface.typeParameters,
  );
  return (
    <ClassOrInterface
      inPackage={inPackage}
      name={classOrInterface.name}
      doc={renderSummary(commentSummary)}
      isInterface={classOrInterface.kind === ReflectionKind.Interface}
      typeParameters={
        classOrInterface.typeParameters?.length
          ? "<" +
            classOrInterface.typeParameters
              .map((tParam) => tParam.name)
              .join(", ") +
            ">"
          : ""
      }
    >
      {typeParamsWithConstraints.length > 0 && (
        <div className="text-sm -mt-4">
          <Highlight
            hide={[0, 1 + typeParamsWithConstraints.length]}
          >{`class Thing<\n${typeParamsWithConstraints.join(
            ",\n",
          )}\n]> {}`}</Highlight>
        </div>
      )}
      {classOrInterface.categories?.map((category) => (
        <div className="flex flex-col mt-6 first:mt-0" key={category.title}>
          <PropCategory
            name={category.title}
            description={renderSummary(
              category.description?.filter(
                (p) => p.kind !== "code" || !p.text.startsWith("```"),
              ),
            )}
            example={renderSummary(
              category.description?.filter(
                (p) => p.kind === "code" && p.text.startsWith("```"),
              ),
            )}
          />
          {category.children.map((prop) => (
            <RenderProp prop={prop} klass={classOrInterface} key={prop.id} />
          ))}
        </div>
      ))}
    </ClassOrInterface>
  );
}

function renderSummary(commentSummary: CommentDisplayPart[] | undefined) {
  return commentSummary?.map((part, idx) =>
    part.kind === "text" ? (
      <span key={idx}>
        {part.text.split("\n").map((line, i, lines) => (
          <>
            {line}
            {i !== lines.length - 1 && <br />}
          </>
        ))}
      </span>
    ) : part.kind === "inline-tag" ? (
      <code key={idx}>
        {part.tag} {part.text}
      </code>
    ) : part.text.startsWith("```") ? (
      <pre key={idx} className="text-xs sm:text-sm">
        <Highlight>{part.text.split("\n").slice(1, -1).join("\n")}</Highlight>
      </pre>
    ) : (
      <Highlight className="whitespace-nowrap" key={idx}>
        {part.text.slice(1, -1)}
      </Highlight>
    ),
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
          signature={printSimplePropSignature(prop, klass, signature)}
          typeParams={printTypeParamsWithConstraints(signature.typeParameters)}
          paramTypes={printParamsWithTypes(signature)}
          returnType={printType(signature.type)}
          doc={renderSummary(signature.comment?.summary)}
          example={renderSummary(
            signature.comment?.getTag("@example")?.content,
          )}
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
      doc={propOrGetSig.comment && renderSummary(propOrGetSig.comment.summary)}
      example={renderSummary(propOrGetSig.comment?.getTag("@example")?.content)}
    />
  );
}

function printSimplePropSignature(
  prop: DeclarationReflection,
  klass: DeclarationReflection,
  signature: SignatureReflection,
): string {
  return (
    `${prop.flags.isStatic ? klass.name : ""}.` +
    printSimpleSignature(prop, signature)
  );
}

function printSimpleSignature(
  item: DeclarationReflection,
  signature: SignatureReflection,
) {
  return `${item.name}${
    signature.typeParameters?.length
      ? "<" +
        signature.typeParameters.map((tParam) => tParam.name).join(", ") +
        ">"
      : ""
  }(${printParams(signature)?.join(", ")})`;
}

function printParams(signature: SignatureReflection) {
  return (
    signature.parameters?.flatMap((param) =>
      param.name === "this"
        ? []
        : [
            param.name === "__namedParameters" &&
            param.type?.type === "reflection"
              ? "{ " +
                param.type.declaration.children
                  ?.map(
                    (child) => child.name + (child.flags.isOptional ? "?" : ""),
                  )
                  .join(", ") +
                " }"
              : param.name + (param.defaultValue ? "?" : ""),
          ],
    ) || []
  );
}

function printParamsWithTypes(signature: SignatureReflection) {
  return (
    signature.parameters?.map(
      (param) =>
        (param.name === "__namedParameters"
          ? ""
          : param.name + (param.defaultValue ? "?" : "") + ": ") +
        printType(param.type),
    ) || []
  );
}

function printTypeParamsWithConstraints(
  typeParams: TypeParameterReflection[] | undefined,
): string[] {
  return (
    typeParams?.flatMap((tParam) =>
      tParam.type ? [`${tParam.name} extends ${printType(tParam.type)}`] : [],
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
                  ", ",
                )}) => ${printType(sig.type)}`,
            )
            .join(" | ") || ""
        );
      } else {
        return (
          "{ " +
          type.declaration.children
            ?.map((child) => `${child.name}: ${printType(child.type)}`)
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
            : printType(part),
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
            : printType(part),
        )
        .join(" | ") || "NO TYPES"
    );
  } else if (type.type === "tuple") {
    return `[${type.elements.map(printType).join(", ")}]`;
  } else if (type.type === "array") {
    if (type.needsParenthesis()) {
      return `(${printType(type.elementType)})[]`;
    } else {
      return printType(type.elementType) + "[]";
    }
  } else if (type.type === "mapped") {
    return `{[${type.parameter} in ${printType(
      type.parameterType,
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
