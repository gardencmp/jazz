import { DEFAULT_FRAMEWORK, isValidFramework } from "@/lib/framework";
import type { MDXComponents } from "mdx/types";
import { headers } from "next/headers";
import Link from "next/link";
import { AnchorHTMLAttributes, DetailedHTMLProps } from "react";

function DocsLink(
  props: DetailedHTMLProps<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  > & { framework: string },
) {
  if (!props.href) {
    return props.children;
  }

  const hasFramework = isValidFramework(props.href.split("/")[2]);

  return (
    <Link
      href={
        hasFramework
          ? props.href
          : props.href.replace("/docs", "/docs/" + props.framework)
      }
    >
      {props.children}
    </Link>
  );
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  const headersList = headers();
  const framework =
    headersList.get("x-pathname")?.split("/")[2] || DEFAULT_FRAMEWORK;

  return {
    a: (props) => <DocsLink {...props} framework={framework} />,
    ...components,
  };
}
