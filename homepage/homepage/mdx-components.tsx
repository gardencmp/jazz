import { DocsLink } from "@/components/docs/DocsLink";
import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    a: (props) => <DocsLink {...props} />,
    ...components,
  };
}
