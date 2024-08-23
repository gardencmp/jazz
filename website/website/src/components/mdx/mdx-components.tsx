import { MDXRemote, MDXRemoteProps } from "next-mdx-remote/rsc";
import React from "react";
import { Alert } from "./alert";
import { Badge } from "./badge";
import { CustomLink } from "./custom-link";
import { Code } from "./code";
import { File, FileProps, Pre } from "./pre-code";
import * as HTMLExamples from "@/app/docs/(content)/guide-html";

export const components = {
  h1: createHeading(1),
  h2: createHeading(2),
  a: CustomLink as React.ComponentType<
    React.AnchorHTMLAttributes<HTMLAnchorElement>
  >,
  code: Code as React.ComponentType<React.HTMLAttributes<HTMLElement>>,
  pre: Pre as React.ComponentType<React.HTMLAttributes<HTMLPreElement>>,
  File: File as React.ComponentType<FileProps>,
  Alert,
  Badge,
  // Grid,
  // GridCard,
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
