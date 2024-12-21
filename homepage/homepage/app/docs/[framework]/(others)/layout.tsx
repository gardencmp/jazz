import { DocsLayout } from "@/components/docs/DocsLayout";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DocsLayout>
      <Prose className="overflow-x-hidden lg:flex-1 py-8">{children}</Prose>
    </DocsLayout>
  );
}
