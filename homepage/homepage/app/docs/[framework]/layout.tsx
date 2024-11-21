import { Providers } from "@/components/Providers";
import DocsLayout from "@/components/docs/DocsLayout";
import { FrameworkSelect } from "@/components/docs/FrameworkSelect";
import { DocNav } from "@/components/docs/nav";
import { Framework } from "@/lib/framework";

export const metadata = {
  title: "Documentation",
  description: "Jazz guide and documentation.",
};

export default function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { framework: string };
}) {
  const framework = params.framework as Framework;

  return (
    <Providers framework={framework}>
      <DocsLayout
        nav={<DocNav />}
        navHeader={<FrameworkSelect className="mb-8" />}
      >
        <div className="flex justify-center lg:gap-5">{children}</div>
      </DocsLayout>
    </Providers>
  );
}
