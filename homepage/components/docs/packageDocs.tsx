import JazzJSDocs from "../../../docsTmp/jazz-js.json";
import { Application, JSONOutput, ReflectionKind } from "typedoc";

const packages = {
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
            <HElemem className="mb-2 mt-0 uppercase tracking-wide font-bold text-sm">{category.title}</HElemem>
            <div className={level > 2 ? "flex gap-2 flex-wrap" : ""}>
                {category.children?.map((childId) => (
                    <Item
                        key={childId}
                        item={parent.children?.find(
                            (child) => child.id == childId
                        )}
                        level={level + 1}
                    />
                ))}
            </div>
        </>
    );
}

export function Item({
    item,
    level,
}: {
    item?: JSONOutput.DeclarationReflection;
    level: number;
}) {
    if (!item) return null;

    const HElemem = `h${level}` as keyof JSX.IntrinsicElements;

    return (
        <div className={"mb-2 mt-2 " + (level < 4 ? "border p-2": "")}>
            <HElemem className="mb-2 mt-0">
                <code className="">
                    <ItemName item={item} />
                </code>
            </HElemem>
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
                item.name +
                `(${(item.signatures[0].parameters || [])
                    .map(renderParamSimple)
                    .join(", ")})`
            );
        }
    } else {
        return item.name;
    }
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
