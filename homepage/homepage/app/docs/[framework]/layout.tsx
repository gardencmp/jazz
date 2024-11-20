import DocsLayout from "@/components/docs/DocsLayout";
import { FrameworkSelect } from "@/components/docs/FrameworkSelect";
import { DocNav } from "@/components/docs/nav";

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
  return (
    <DocsLayout
      nav={<DocNav framework={params.framework} />}
      navHeader={
        <FrameworkSelect className="mb-8" framework={params.framework} />
      }
    >
      <div className="flex justify-center lg:gap-5">{children}</div>
    </DocsLayout>
  );
}
