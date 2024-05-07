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
    lang?: string
}) {
    const lines = (await highlighter).codeToThemedTokens(
        children,
        lang,
        "css-variables"
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
    children,
    doc,
    isInterface,
}: {
    inPackage: string;
    name: string;
    children: ReactNode;
    doc: ReactNode;
    isInterface?: boolean;
}) {
    return (
        <>
            <a
                id={inPackage + "/" + name}
                href={"#" + inPackage + "/" + name}
                className="pt-[6rem] -mt-[6rem] -ml-6 w-4 -mb-6 flex items-center justify-center opacity-0 peer-group-hover:opacity-100 target:opacity-100"
                tabIndex={-1}
            >
                <LinkIcon size={15} />
            </a>
            <h3 className="peer">
                <a href={"#" + inPackage + "/" + name}>
                    <Highlight>{(isInterface ? "interface " : "class ") + name}</Highlight>
                </a>
            </h3>
            <div className="pl-2">
                <div className=" mt-4 text-sm">{doc}</div>
                <div className="">{children}</div>
            </div>
        </>
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
    name: string;
    type: string;
    doc: ReactNode;
    example: ReactNode;
}) {
    const nLinesInType = type.split("\n").length;
    return (
        <div className="group flex flex-wrap items-baseline lg:grid grid-cols-8 md:gap-2 py-2 border-t border-stone-200 dark:border-stone-800 hover:border-stone-400 hover:dark:border-stone-600 mt-4">
            <div className="col-span-1 overflow-x-scroll pb-1 -mr-4 md:mr-0">
                <div className="relative z-10 ">
                    <pre className="text-sm">
                        <span className="bg-stone-50 dark:bg-stone-950">
                            <Highlight>{name}</Highlight>{" "}
                        </span>
                    </pre>
                </div>
            </div>
            <div className="col-span-2 overflow-x-scroll pb-1 pl-4 md:pl-0">
                <div className="relative z-10 ">
                    <pre className="text-xs">
                        <span className="bg-stone-50 dark:bg-stone-950">
                            <span className="opacity-60 group-hover:opacity-100">
                                <Highlight
                                    hide={[0, 1, 2 + nLinesInType]}
                                >{`class X {\nprop:\n${type}`}</Highlight>
                            </span>
                        </span>
                    </pre>
                </div>
            </div>
            <div className="w-full col-span-3 pl-4 md:pl-0">
                <div className="flex flex-col items-start pr-8">
                    <div className="bg-stone-50 dark:bg-stone-950 relative z-10">
                        <DocComment>{doc || "⚠️ undocumented"}</DocComment>
                    </div>
                </div>
            </div>
            {example && (
                <div className="relative w-full overflow-x-scroll col-span-2 pl-4 md:pl-0 mt-6 md:mt-0 text-xs opacity-60 group-hover:opacity-100">
                    <div className="opacity-30 absolute -top-4 text-xs">
                        Example:
                    </div>
                    {example}
                </div>
            )}
        </div>
    );
}

export function FnDecl({
    signature,
    paramTypes,
    returnType,
    doc,
    example,
}: {
    signature: string;
    paramTypes: string;
    returnType: string;
    doc: ReactNode;
    example: ReactNode;
}) {
    const nLinesInType = paramTypes.split("\n").length;
    return (
        <div className="group flex flex-wrap items-baseline lg:grid grid-cols-8 md:gap-2 py-2 border-t border-stone-200 dark:border-stone-800 hover:border-stone-400 hover:dark:border-stone-600 mt-4">
            <div className="col-span-3 overflow-x-scroll pb-1 -mr-4 md:mr-0">
                <div className="relative z-10 ">
                    <pre className="text-sm">
                        <span className="bg-stone-50 dark:bg-stone-950">
                            <Highlight>{signature}</Highlight>{" "}
                        </span>
                    </pre>
                </div>
            </div>

            <div className="w-full col-start-2 col-span-2 overflow-x-scroll pb-1 pl-4 md:pl-0">
                <div className="relative z-10 ">
                    <pre className="text-xs">
                        <span className="bg-stone-50 dark:bg-stone-950">
                            <span className="relative opacity-60 group-hover:opacity-100">
                                <Highlight
                                    hide={[0]}
                                >{`{\n${paramTypes}`}</Highlight>
                            </span>
                        </span>
                    </pre>
                    <pre className="text-xs mt-1 mb-3">
                        <span className="bg-stone-50 dark:bg-stone-950">
                            <span className="relative opacity-60 group-hover:opacity-100">
                                <Highlight
                                    hide={[0, 2 + nLinesInType]}
                                >{`() \n=> ${returnType}`}</Highlight>
                            </span>
                        </span>
                    </pre>
                </div>
            </div>
            <div className="w-full row-start-1 col-start-4 col-span-3 row-span-2 pl-4 md:pl-0">
                <div className="flex flex-col items-start pr-8">
                    <div className="bg-stone-50 dark:bg-stone-950 relative z-10">
                        <DocComment>{doc || "⚠️ undocumented"}</DocComment>
                    </div>
                </div>
            </div>
            {example && (
                <div className="relative w-full overflow-x-scroll row-start-1 col-start-7 col-span-2 row-span-2 pl-4 md:pl-0 mt-6 md:mt-0 text-xs opacity-60 group-hover:opacity-100">
                    <div className="opacity-30 absolute -top-4 text-xs">
                        Example:
                    </div>
                    {example}
                </div>
            )}
        </div>
    );
}

export function PropCategory({ name }: { name: string }) {
    return (
        <div className="col-span-6 mt-8 -mb-4 text-[0.7em] uppercase font-medium tracking-widest opacity-50">
            {name}
        </div>
    );
}

export function DocComment({ children }: { children: ReactNode }) {
    return (
        <div className="prose-inner-sm text-[0.7em] leading-tight">
            {children}
        </div>
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
            value isn't loaded yet. Accessing one will cause it to be loaded if
            done from inside a <i>Subscription Context</i>.
        </>
    );
}
