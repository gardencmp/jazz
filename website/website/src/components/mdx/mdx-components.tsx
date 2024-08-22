import Link from "next/link";
import Image, { ImageProps } from "next/image";
import { MDXRemote, MDXRemoteProps } from "next-mdx-remote/rsc";
import { highlight } from "sugar-high";
import React, { useId, ReactNode } from "react";
import { Slogan, ClipboardCopy, Alert } from "./index";
import * as HTMLExamples from "@/app/docs/(content)/guide-html";
import { Grid, GridCard } from "./grid";
import { Badge } from "./badge";
import clsx from "clsx";

interface TableProps {
  data: {
    headers: string[];
    rows: string[][];
  };
}

function Table({ data }: TableProps) {
  let headers = data.headers.map((header, index) => (
    <th key={index}>{header}</th>
  ));
  let rows = data.rows.map((row, index) => (
    <tr key={index}>
      {row.map((cell, cellIndex) => (
        <td key={cellIndex}>{cell}</td>
      ))}
    </tr>
  ));

  return (
    <table>
      <thead>
        <tr>{headers}</tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}

interface CustomLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

function CustomLink({ href = "", ...props }: CustomLinkProps) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} {...props}>
        {props.children}
      </Link>
    );
  }

  if (href.startsWith("#")) {
    return <a href={href} {...props} />;
  }

  return <a href={href} target="_blank" rel="noopener noreferrer" {...props} />;
}

function RoundedImage(props: ImageProps) {
  // eslint-disable-next-line jsx-a11y/alt-text
  return <Image className="rounded-lg" {...props} />;
}

interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  children: ReactNode | string;
  language?: string;
}

export function Code({
  children,
  language = "typescript",
  ...props
}: CodeProps) {
  const codeContent = typeof children === "string" ? children : "";
  let codeHTML = highlight(codeContent);
  return (
    <code
      className={`language-${language}`}
      dangerouslySetInnerHTML={{ __html: codeHTML }}
      {...props}
    />
  );
}

interface PreProps extends React.HTMLAttributes<HTMLPreElement> {
  children: ReactNode;
  showCopyAction?: boolean;
}

export function Pre({ children, showCopyAction = true, ...props }: PreProps) {
  const textContent = React.Children.toArray(children)
    .filter(
      (child) =>
        React.isValidElement(child) &&
        (child.type === Code || child.type === "code"),
    )
    .map((child) => {
      if (
        React.isValidElement(child) &&
        typeof child.props.children === "string"
      ) {
        return child.props.children;
      }
      return "";
    })
    .join("");

  return (
    <>
      {showCopyAction && (
        <div className="absolute top-2 right-2 z-10">
          <ClipboardCopy className="text-large">{textContent}</ClipboardCopy>
        </div>
      )}
      <pre {...props}>{children}</pre>
    </>
  );
}

interface FileProps extends React.HTMLAttributes<HTMLElement> {
  children: ReactNode | string;
  name?: string;
  highlightLines?: number[];
  theme?: "light" | "dark";
  className?: string;
}

/* 
  Using this "changed lines" highlighting method: 
  https://github.com/huozhi/sugar-high?tab=readme-ov-file#line-highlight 
 */
export function File({
  children,
  name,
  highlightLines = [],
  theme = "dark",
  className,
  ...props
}: FileProps) {
  const uniqueId = useId();
  return (
    <div
      className={clsx(
        "File relative rounded-lg border !my-w6",
        theme === "dark" ? "bg-fill-contrast" : "bg-background",
        className,
      )}
      data-file-id={uniqueId}
      {...props}
    >
      <style>
        {highlightLines
          .map(
            (line) =>
              `[data-file-id="${uniqueId}"] .sh__line:nth-child(${line}) {
            background-color: var(--code-line-highlight);
            border-color: var(--code-line-marker);
          }`,
          )
          .join("\n")}
      </style>
      {name && (
        <div className="h-[44px] flex items-center px-w4 font-mediu text-canvas border-b border-white-a5 text-[0.8em] font-mono">
          {name}
        </div>
      )}
      {children}
    </div>
  );
}

function slugify(str: string): string {
  return str
    .toString()
    .toLowerCase()
    .trim() // Remove whitespace from both ends of a string
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w\-]+/g, "") // Remove all non-word characters except for -
    .replace(/\-\-+/g, "-"); // Replace multiple - with single -
}

function createHeading(level: 1 | 2 | 3 | 4 | 5 | 6) {
  const Heading = React.forwardRef<
    HTMLHeadingElement,
    React.HTMLAttributes<HTMLHeadingElement>
  >(({ children, ...props }, ref) => {
    let slug = slugify(children as string);
    return React.createElement(
      `h${level}`,
      { id: slug, ref, ...props },
      [
        React.createElement("a", {
          href: `#${slug}`,
          key: `link-${slug}`,
          className: "anchor",
        }),
      ],
      children,
    );
  });

  Heading.displayName = `Heading${level}`;

  return Heading;
}

export const components = {
  h1: createHeading(1),
  h2: createHeading(2),
  // h3: createHeading(3),
  // h4: createHeading(4),
  // h5: createHeading(5),
  // h6: createHeading(6),
  Image: RoundedImage,
  a: CustomLink as React.ComponentType<
    React.AnchorHTMLAttributes<HTMLAnchorElement>
  >,
  code: Code as React.ComponentType<React.HTMLAttributes<HTMLElement>>,
  pre: Pre as React.ComponentType<React.HTMLAttributes<HTMLPreElement>>,
  Table: Table as React.ComponentType<any>,
  File: File as React.ComponentType<FileProps>,
  Slogan,
  Alert,
  Grid,
  GridCard,
  Badge,
  ...HTMLExamples,
};

interface CustomMDXProps extends MDXRemoteProps {
  components?: Record<string, React.ComponentType<any>>;
}

export const CustomMDX = (props: CustomMDXProps) => {
  return (
    <MDXRemote
      {...props}
      components={{
        ...components,
        ...(props.components || {}),
      }}
    />
  );
};
