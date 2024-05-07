import {
    DeclarationReflection,
    ReflectionKind,
} from "typedoc";
import {
    ClassOrInterface,
    FnDecl,
    Highlight,
    PropCategory,
    PropDecl,
} from "./tags";
import { requestProject } from "./requestProject";


export async function PackageDocs({
    package: packageName,
}: {
    package: string;
}) {
    let project = await requestProject(packageName);

    // console.dir(project, {depth: 10});

    return (
        <>
            <h2>
                <code>{packageName}</code> (package)
            </h2>
            {project.categories?.map((category) => {
                return (
                    <section key={category.title}>
                        <h3>{category.title}</h3>
                        {category.children.map((child) => (
                            <RenderPackageChild child={child} key={child.id} inPackage={packageName} />
                        ))}
                    </section>
                );
            })}
        </>
    );
}

function RenderPackageChild({ child, inPackage }: { child: DeclarationReflection, inPackage: string }) {
    if (
        child.kind === ReflectionKind.Class ||
        child.kind === ReflectionKind.Interface
    ) {
        return <RenderClassOrInterface classOrInterface={child} inPackage={inPackage}/>;
    } else if (child.kind === ReflectionKind.TypeAlias) {
        return (
            <>
                <h3 className="not-prose">
                    <Highlight>{`type ${child.name}`}</Highlight>
                </h3>
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
    inPackage: string,
    classOrInterface: DeclarationReflection;
}) {
    return (
        <div className="not-prose">
            <ClassOrInterface
                inPackage={inPackage}
                name={classOrInterface.name}
                doc="TODO"
                isInterface={classOrInterface.kind === ReflectionKind.Interface}
            >
                {classOrInterface.categories?.map((category) => (
                    <div key={category.title}>
                        <PropCategory name={category.title} />
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
        </div>
    );
}

function RenderProp({
    prop,
    klass,
}: {
    prop: DeclarationReflection;
    klass: DeclarationReflection;
}) {
    return prop.kind === ReflectionKind.FunctionOrMethod ? (
        prop
            .getAllSignatures()
            .map((signature) => (
                <FnDecl
                    key={signature.id}
                    signature={signature.toString()}
                    paramTypes="TODO"
                    returnType={signature.type?.toString() || "NO TYPE"}
                    doc="TODO"
                />
            ))
    ) : (
        <PropDecl
            name={
                (prop.flags.isStatic
                    ? klass.name
                    : klass.name.toLowerCase()[0] + klass.name.slice(1)) +
                (prop.name.startsWith("[") ? "" : ".") +
                prop.name
            }
            type={prop.type?.toString() || "NO TYPE"}
        />
    );
}
