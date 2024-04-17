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
        <h3 id={"class-" + name}>
            <Highlight>{`class ${name} {`}</Highlight>
        </h3>
    );
}

export function ClassFooter() {
    return <Highlight>{`}`}</Highlight>;
}

export function Class({
    name,
    children,
}: {
    name: string;
    children: ReactNode;
}) {
    return (
        <>
            <ClassHeader name={name} />
            <div className="ml-4">{children}</div>
            <ClassFooter />
        </>
    );
}

export function ClassRef({ name }: { name: string }) {
    return <Highlight hide={[0]}>{`class\n${name}`}</Highlight>;
}

export function PropRef({ on, prop }: { on: string; prop: string }) {
    return <Highlight>{`${on}.${prop}`}</Highlight>;
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
        <h5>
            <span className="text-sm">
                <Highlight
                    hide={[0, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                >{`class X {\n${name}:\n${type}\n}`}</Highlight>{" "}
            </span>
            <span className={nLinesInType > 1 ? "text-xs" : "text-sm"}>
                <pre className={nLinesInType > 1 ? "inline-block align-text-top" : "inline"}>
                    <Highlight
                        hide={[0, 1, 2 + nLinesInType]}
                    >{`class X {\n${name}:\n${type}\n}`}</Highlight>
                </pre>
            </span>
            <DocComment> &mdash; {doc}</DocComment>
        </h5>
    );
}

export function DocComment({ children }: { children: ReactNode }) {
    return <span className="opacity-50 text-sm">{children}</span>;
}
