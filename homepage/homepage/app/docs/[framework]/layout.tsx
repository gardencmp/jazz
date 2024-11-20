import DocsLayout from "@/components/docs/DocsLayout";
import { FrameworkSelect } from "@/components/docs/FrameworkSelect";
import { DocNav } from "@/components/docs/nav";

export const metadata = {
  title: "Documentation",
  description: "Jazz guide and documentation.",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DocsLayout
      nav={<DocNav />}
      navHeader={<FrameworkSelect className="mb-8" />}
    >
      <div className="flex justify-center lg:gap-5">{children}</div>
    </DocsLayout>
  );
}
