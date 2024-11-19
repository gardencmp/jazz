import DocsLayout from "@/components/docs/DocsLayout";
import { DocNav } from "@/components/docs/nav";
import { clsx } from "clsx";

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
    <DocsLayout nav={<DocNav />}>
      <div className="flex justify-center lg:gap-5 data-pagefind-body">
        {children}
      </div>
    </DocsLayout>
  );
}
