import { LinkIcon } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
import { getHighlighter } from "shiki";

const highlighter = getHighlighter({
  langs: ["typescript", "bash"],
  theme: "css-variables", // use the theme
});

export function Example({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1">
      <div className="border bg-white dark:bg-stone-900 rounded shadow-sm">
        <div className="py-1 px-2  border-b text-xs">Example</div>
        <div className="py-1 px-2 overflow-x-auto">{children}</div>
      </div>
    </div>
  );
}

export async function Highlight({
  children,
  hide,
  lang = "typescript",
  className = "",
}: {
  children: string;
  hide?: number[];
  lang?: string;
  className?: string;
}) {
  const lines = (await highlighter).codeToThemedTokens(
    children,
    lang,
    "css-variables",
  );

  return (
    <code className={className}>
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
      <div
        id={name}
        className="peer sticky top-0 mt-4 md:mt-0 md:top-[2rem] md:pt-[2.5rem] bg-white dark:bg-stone-950 z-20"
      >
        <Link
          href={"#" + name}
          className="inline-flex items-center gap-2 lg:-ml-[22px]"
        >
          <LinkIcon size={14} className="hidden lg:inline" />
          <h3>
            <Highlight>
              {(isInterface ? "interface " : "class ") + name + typeParameters}
            </Highlight>
          </h3>
        </Link>
      </div>
      <div className="flex flex-col gap-5">
        <div>{doc}</div>
        <div>{children}</div>
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
    <div className="text-sm py-3 flex flex-col gap-5">
      {(name || type) && (
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
      )}
      <div className="flex flex-col lg:flex-row gap-4">
        <DocComment>{doc || "⚠️ undocumented"}</DocComment>
        {example && <Example>{example}</Example>}
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
    <div className="text-sm py-3 flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div>
          {<Highlight>{signature + ":"}</Highlight>}{" "}
          <Highlight>{returnType}</Highlight>
        </div>
        <div className="pl-4 text-xs flex flex-col gap-2">
          {typeParams.length > 0 && (
            <div>
              <Highlight
                hide={[0, 1 + typeParams.length]}
              >{`class Thing<\n${typeParams.join(",\n")}\n]> {}`}</Highlight>
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
      </div>
      <div className="flex flex-col lg:flex-row gap-4">
        <DocComment>{doc || "⚠️ undocumented"}</DocComment>
        {example && <Example>{example}</Example>}
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
      <div className="col-span-6 uppercase font-medium tracking-widest text-stone-500 text-xs py-3">
        {name}
      </div>
      {description && <PropDecl doc={description} example={example} />}
    </>
  );
}

export function DocComment({ children }: { children: ReactNode }) {
  return (
    <div className="prose-inner-sm flex-1 max-w-2xl leading-snug">
      {children}
    </div>
  );
}
