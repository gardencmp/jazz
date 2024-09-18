import { LinkIcon } from "lucide-react";
import { ReactNode } from "react";
import { getHighlighter } from "shiki";

const highlighter = getHighlighter({
    langs: ["typescript", "bash"],
    theme: "css-variables", // use the theme
});

export async function Highlight({
    children,
    hide,
    lang = "typescript",
}: {
    children: string;
    hide?: number[];
    lang?: string;
}) {
    const lines = (await highlighter).codeToThemedTokens(
        children,
        lang,
        "css-variables",
    );

    return (
        <code>
            {lines
                .filter((_, i) => !hide?.includes(i))
                .map((line, i, all) => (
                    <>
                        {line.map((token, i) => (
                            <span key={i} style={{ color: token.color }}>
                                {token.content}
                            </span>
                        ))}
                        {i !== all.length - 1 && <br />}
                    </>
                ))}
        </code>
    );
}

export function ClassOrInterface({
    inPackage,
    name,
    typeParameters,
    children,
    doc,
    isInterface,
}: {
    inPackage: string;
    name: string;
    typeParameters?: string;
    children: ReactNode;
    doc: ReactNode;
    isInterface?: boolean;
}) {
    return (
        <div className="relative not-prose">
            <a
                id={name}
                href={"#" + name}
                className="absolute md:top-[3.5rem] -ml-6 w-4 flex items-center justify-center opacity-0 peer-group-hover:opacity-100 target:opacity-100"
                tabIndex={-1}
            >
                <LinkIcon size={15} />
            </a>
            <h4 className="peer sticky top-0 pt-[0.5rem] md:top-[2.5rem] md:pt-[3rem] bg-stone-50 dark:bg-stone-950 z-20">
                <a href={"#" + name}>
                    <Highlight>
                        {(isInterface ? "interface " : "class ") +
                            name +
                            typeParameters}
                    </Highlight>
                </a>
            </h4>
            <div className="pl-2">
                <div className=" mt-4 text-sm">{doc}</div>
                <div className="">{children}</div>
            </div>
        </div>
    );
}

export function ClassRef({ name }: { name: string }) {
    return <Highlight hide={[0]}>{`class\n${name}`}</Highlight>;
}

export function PropRef({ on, prop }: { on?: string; prop: string }) {
    return on ? (
        <Highlight>{`${on}.${prop}`}</Highlight>
    ) : (
        <Highlight>{prop}</Highlight>
    );
}

export function PropDecl({
    name,
    type,
    doc,
    example,
}: {
    name?: string;
    type?: string;
    doc: ReactNode;
    example?: ReactNode;
}) {
    return (
        <div className="py-2 border-t border-stone-200 dark:border-stone-800 mt-4 text-sm">
            <div>
                {name && <Highlight>{name + ":"}</Highlight>}
                {"  "}
                {type && (
                    <span className="opacity-75 text-xs pl-1">
                        <Highlight
                            hide={[0, 1, 2 + type.split("\n").length]}
                        >{`class X {\nprop:\n${type}`}</Highlight>
                    </span>
                )}
            </div>
            <div className="lg:flex gap-2">
                <div className="ml-4 mt-2 flex-[3]">
                    <DocComment>{doc || "⚠️ undocumented"}</DocComment>
                </div>
                {example && (
                    <div className="ml-4 lg:ml-0 lg:mt-0 flex-[1] relative w-full overflow-x-scroll col-span-2 pl-4 md:pl-0 md:mt-0 text-xs opacity-60 group-hover:opacity-100">
                        <div className="opacity-30 text-xs -mb-4">Example:</div>
                        {example}
                    </div>
                )}
            </div>
        </div>
    );
}

export function FnDecl({
    signature,
    typeParams,
    paramTypes,
    returnType,
    doc,
    example,
}: {
    signature: string;
    typeParams: string[];
    paramTypes: string[];
    returnType: string;
    doc: ReactNode;
    example: ReactNode;
}) {
    return (
        <div className="py-2 border-t border-stone-200 dark:border-stone-800 mt-4 text-sm">
            <div>
                {<Highlight>{signature + ":"}</Highlight>}{" "}
                <span className="opacity-75 text-xs pl-1">
                    <Highlight>{returnType}</Highlight>
                </span>
            </div>
            <div className="ml-4 mt-2 text-xs opacity-75 flex flex-col gap-2">
                {typeParams.length > 0 && (
                    <div>
                        <Highlight
                            hide={[0, 1 + typeParams.length]}
                        >{`class Thing<\n${typeParams.join(
                            ",\n",
                        )}\n]> {}`}</Highlight>
                    </div>
                )}
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
            <div className="lg:flex gap-2">
                <div className="ml-4 mt-2 flex-[3]">
                    <DocComment>{doc || "⚠️ undocumented"}</DocComment>
                </div>
                {example && (
                    <div className="flex-[1] relative w-full overflow-x-scroll col-span-2 pl-4 md:pl-0 mt-6 md:mt-0 text-xs opacity-60 group-hover:opacity-100">
                        <div className="opacity-30 text-xs -mb-4">Example:</div>
                        {example}
                    </div>
                )}
            </div>
        </div>
    );
}

export function PropCategory({
    name,
    description,
    example,
}: {
    name: string;
    description?: ReactNode;
    example?: ReactNode;
}) {
    return (
        <>
            <div className="col-span-6 mt-8 -mb-4 text-[0.7em] uppercase font-medium tracking-widest opacity-50">
                {name}
            </div>
            {description && <PropDecl doc={description} example={example} />}
        </>
    );
}

export function DocComment({ children }: { children: ReactNode }) {
    return (
        <div className="prose-inner-sm max-w-xl leading-snug">{children}</div>
    );
}

export function NewCoValueExplainer({ type }: { type: string }) {
    return (
        <>
            Creates a new <ClassRef name={type} /> with the given initial
            values. The <ClassRef name={type} /> is immediately persisted
            locally and synced to connected peers. Access rights are determined
            by roles in the owner <ClassRef name="Group" /> or directly by the
            owner <ClassRef name="Account" />.
        </>
    );
}

export function RefValueExplainer({ propName }: { propName: string }) {
    return (
        <>
            Note that even non-optional <PropRef on="co" prop="ref(...)" />{" "}
            {propName} might be <Highlight>null</Highlight> if the referenced
            value isn&apos;t loaded yet. Accessing one will cause it to be
            loaded if done from inside a <i>Subscription Context</i>.
        </>
    );
}
