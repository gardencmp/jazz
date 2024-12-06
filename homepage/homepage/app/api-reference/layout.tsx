import { ApiNav } from "@/components/docs/ApiNav";
import DocsLayout from "@/components/docs/DocsLayout";
import { requestProjects } from "@/components/docs/requestProject";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";

export const metadata = {
  title: "API reference",
  description:
    "API references for packages like jazz-tools, jazz-react, and more.",
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const projects = await requestProjects();

  return (
    <DocsLayout nav={<ApiNav projects={projects} />}>
      <Prose className="py-8 [&_*]:scroll-mt-[8rem]">{children}</Prose>
    </DocsLayout>
  );
}
