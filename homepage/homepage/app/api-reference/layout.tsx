import { ApiNav } from "@/components/docs/ApiNav";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";

export const metadata = {
  title: "API reference",
  description:
    "API references for packages like jazz-tools, jazz-react, and more.",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DocsLayout nav={<ApiNav />}>
      <Prose className="py-8 [&_*]:scroll-mt-[8rem]">{children}</Prose>
    </DocsLayout>
  );
}
