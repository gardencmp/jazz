import { Providers } from "@/components/Providers";
import DocsLayout from "@/components/docs/DocsLayout";
import { FrameworkSelect } from "@/components/docs/FrameworkSelect";
import { DocNav } from "@/components/docs/nav";

export const metadata = {
  title: "Documentation",
  description: "Jazz guide and documentation.",
};

export type Framework = "react" | "react-native" | "vue";

function isValidFramework(framework: string): framework is Framework {
  return ["react", "react-native", "vue"].includes(framework);
}

export default function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { framework: string };
}) {
  const framework = isValidFramework(params.framework)
    ? params.framework
    : "react";

  return (
    <Providers framework={framework}>
      <DocsLayout
        nav={<DocNav framework={framework} />}
        navHeader={<FrameworkSelect className="mb-8" />}
      >
        <div className="flex justify-center lg:gap-5">{children}</div>
      </DocsLayout>
    </Providers>
  );
}
