import Link from "next/link";
import Image, { ImageProps } from "next/image";
import { MDXRemote, MDXRemoteProps } from "next-mdx-remote/rsc";
import { highlight } from "sugar-high";
import React from "react";
import { Slogan, ClipboardCopy, Alert } from "./index";
import * as HTMLExamples from "@/app/docs/content/guide-html";
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
  children: string;
}

function Code({ children, ...props }: CodeProps) {
  let codeHTML = highlight(children);
  return <code dangerouslySetInnerHTML={{ __html: codeHTML }} {...props} />;
}

function Pre({ children, ...props }: React.HTMLAttributes<HTMLElement>) {
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
    <div className="overflow-hidden">
      <div className="absolute top-2 right-2 z-10">
        <ClipboardCopy className="text-large">{textContent}</ClipboardCopy>
      </div>
      <pre {...props}>{children}</pre>
    </div>
  );
}

interface FileProps extends React.HTMLAttributes<HTMLElement> {
  children: string;
  name: string;
  highlightLines?: number[];
}

function File({ children, name, highlightLines = [], ...props }: FileProps) {
  /* TODO: fix failing attempt at adding "changed lines" to the file. Attempting to use this method: https://github.com/huozhi/sugar-high?tab=readme-ov-file#line-highlight */
  const highlightClasses = highlightLines
    .map(
      (line) => `[&_div_div_pre_code_.sh__line:nth-child(${line})]:bg-gray-100`,
    )
    .join(" ");

  return (
    <div
      className={clsx(
        "File relative bg-fill-contrast rounded-lg border !my-w6",
        highlightClasses,
      )}
      {...props}
    >
      <h4 className="h-[44px] flex items-center px-w4 font-mediu text-canvas border-b border-white-a5 text-[0.8em] font-mono">
        {name}
      </h4>
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

let components = {
  h1: createHeading(1),
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  h5: createHeading(5),
  h6: createHeading(6),
  Image: RoundedImage,
  a: CustomLink as React.ComponentType<
    React.AnchorHTMLAttributes<HTMLAnchorElement>
  >,
  code: Code as React.ComponentType<React.HTMLAttributes<HTMLElement>>,
  pre: Pre,
  Table: Table as React.ComponentType<any>,
  Slogan,
  Alert,
  File,
};

interface CustomMDXProps extends MDXRemoteProps {
  components?: Record<string, React.ComponentType<any>>;
}

export function CustomMDX(props: CustomMDXProps) {
  return (
    <MDXRemote
      {...props}
      components={{
        ...components,
        ...HTMLExamples,
        ...(props.components || {}),
      }}
    />
  );
}
