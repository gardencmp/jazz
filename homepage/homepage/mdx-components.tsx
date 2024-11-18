import type { MDXComponents } from "mdx/types";
import Link from "next/link";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    a: (props) =>
      props.href ? (
        <Link href={props.href}>{props.children}</Link>
      ) : (
        props.children
      ),
    ...components,
  };
}
