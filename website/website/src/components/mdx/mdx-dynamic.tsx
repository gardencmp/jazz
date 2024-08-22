import dynamic from "next/dynamic";
import { MDXRemoteProps } from "next-mdx-remote/rsc";
import { components } from "./mdx-components";

const MDXRemote = dynamic(
  () => import("next-mdx-remote/rsc").then((mod) => mod.MDXRemote),
  {
    ssr: false,
  },
);

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
