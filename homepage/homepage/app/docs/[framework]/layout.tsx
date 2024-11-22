import DocsLayout from "@/components/docs/DocsLayout";
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
    <DocsLayout nav={<DocNav />}>
      <div className="flex justify-center lg:gap-5">{children}</div>
    </DocsLayout>
  );
}
