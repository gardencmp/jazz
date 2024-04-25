import { LinkIcon } from "lucide-react";
import { ReactNode } from "react";
import { getHighlighter } from "shiki";

const highlighter = getHighlighter({
    langs: ["typescript"],
    theme: "css-variables", // use the theme
});

export async function Highlight({
    children,
    hide,
}: {
    children: string;
    hide?: number[];
}) {
    const lines = (await highlighter).codeToThemedTokens(
        children,
        "typescript",
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

export function ClassHeader({ name }: { name: string }) {
    return (
        <>
            <a
                id={name.split("<")[0]}
                href={"#" + name.split("<")[0]}
                className="pt-[9.5rem] -mt-[9.5rem] -ml-6 w-4 -mb-6 flex items-center justify-center opacity-20 hover:opacity-100 target:opacity-100"
                tabIndex={-1}
            >
                <LinkIcon size={15} />
            </a>
            <h3 className="sticky top-[2.2rem] md:top-[8.7rem] bg-stone-50 dark:bg-stone-950">
                <a href={"#" + name.split("<")[0]}>
                    <Highlight>{`class ${name} {`}</Highlight>
                </a>
            </h3>
        </>
    );
}

export function ClassFooter() {
    return (
        <>
            <div>
                <Highlight>{`}`}</Highlight>
            </div>
            <div className="mb-8 h-8 sticky top-[2.2rem] md:top-[8.7rem] bg-stone-50 dark:bg-stone-950" />
        </>
    );
}

export function Class({
    name,
    children,
    doc,
}: {
    name: string;
    children: ReactNode;
    doc: ReactNode;
}) {
    return (
        <>
            <ClassHeader name={name} />
            <div className="ml-4 mt-4 text-sm">{doc}</div>
            <div className="ml-4">{children}</div>
            <ClassFooter />
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
}: {
    name: string;
    type: string;
    doc: ReactNode;
}) {
    const nLinesInType = type.split("\n").length;
    return (
        <div className="flex flex-wrap items-baseline lg:grid grid-cols-6 md:gap-2 py-2">
            <div className="col-span-1 overflow-x-scroll pb-1 -mr-4 md:mr-0">
                <div className="hidden md:block h-1 border-b border-dotted border-stone-300 dark:border-stone-800 relative top-[0.63em]" />
                <div className="relative z-10 ">
                    <pre className="text-sm">
                        <span className="bg-stone-50 dark:bg-stone-950">
                            <Highlight
                                hide={[0, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                            >{`class X {\n${name}:\n${type}\n}`}</Highlight>{" "}

                        </span>
                    </pre>
                </div>
            </div>
            <div className="col-span-2 overflow-x-scroll pb-1 pl-4 md:pl-0">
                <div className="hidden md:block h-1 border-b border-dotted border-stone-300 dark:border-stone-800 relative top-[0.45em]" />
                <div className="relative z-10 ">
                    <pre className="text-xs">
                        <span className="bg-stone-50 dark:bg-stone-950">
                            <span className="opacity-60 hover:opacity-100">
                                <Highlight
                                    hide={[0, 1, 2 + nLinesInType]}
                                >{`class X {\n${name}:\n${type.split("\n")[0] + " "}\n${type.split("\n").slice(1).join("\n")}`}</Highlight>
                            </span>
                        </span>
                    </pre>
                </div>
            </div>
            <div className="w-full col-span-3 pl-4 md:pl-0">
                <DocComment>{doc || "⚠️ undocumented"}</DocComment>
            </div>
        </div>
    );
}

export function PropCategory({ name }: { name: string }) {
    return (
        <div className="col-span-6 mt-8 text-[0.7em] uppercase font-medium tracking-widest opacity-50">
            {name}
        </div>
    );
}

export function DocComment({ children }: { children: ReactNode }) {
    return <div className="prose-sm text-xs">{children}</div>;
}

export function NavPackage({
    name,
    children,
}: {
    name: string;
    children: ReactNode;
}) {
    return (
        <div className="border dark:border-stone-800 rounded pl-2 mb-6">
            <div className="-mt-3 -mb-2">
                <code className="p-2 bg-stone-50 dark:bg-stone-925">
                    {name}
                </code>
            </div>
            {children}
        </div>
    );
}
