import dynamic from "next/dynamic";
import { MDXRemoteProps } from "next-mdx-remote/rsc";
import { components } from "./mdx-components";
import * as HTMLExamples from "@/app/docs/(content)/guide-html";

const MDXRemote = dynamic(
  () => import("next-mdx-remote/rsc").then((mod) => mod.MDXRemote),
  {
    ssr: false,
  },
);

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
