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
                className="[&:target+*]:bg-amber-100"
            />
            <h3 className="sticky top-14 bg-stone-50">
                <a href={"#" + name.split("<")[0]}>
                    <Highlight>{`class ${name} {`}</Highlight>
                </a>
            </h3>
        </>
    );
}

export function ClassFooter() {
    return <div className="mb-10"><Highlight>{`}`}</Highlight></div>
}

export function Class({
    name,
    children,
    doc
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
    const longLinesInType = type.split("\n").some((line) => line.length > 30)
    return (
        <div className="flex items-baseline flex-wrap lg:grid grid-cols-7 gap-4 py-2 border-b">
            <div className="text-sm leading-tighter whitespace-nowrap font-extrabold">
                <Highlight
                    hide={[0, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                >{`class X {\n${name}:\n${type}\n}`}</Highlight>{" "}
            </div>
            <div className="col-span-2 overflow-x-scroll">
                <span className={(longLinesInType || nLinesInType > 3) ? "text-xs" : "text-sm"}>
                    <pre>
                        <Highlight
                            hide={[0, 1, 2 + nLinesInType]}
                        >{`class X {\n${name}:\n${type}\n}`}</Highlight>
                    </pre>
                </span>
            </div>
            <div className="col-span-4">
                <DocComment>{doc || "⚠️ undocumented"}</DocComment>
            </div>
        </div>
    );
}

export function PropCategory({ name }: { name: string }) {
    return (
        <div className="col-span-6 mt-8 text-xs uppercase font-extrabold">
            {name}
        </div>
    );
}

export function DocComment({ children }: { children: ReactNode }) {
    return <div className="prose-sm">{children}</div>;
}

export function NavPackage({ name, children }: { name: string; children: ReactNode }) {
    return <div className="border rounded pl-2 mb-6"><div className="-mt-3 -mb-2"><code>{name}</code></div>{children}</div>
}