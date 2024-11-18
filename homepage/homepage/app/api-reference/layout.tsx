import { ApiNav } from "@/components/docs/ApiNav";
import { DocNav } from "@/components/docs/nav";
import { clsx } from "clsx";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";

export const metadata = {
  title: "Docs",
  description: "Jazz Guide & Docs.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container relative grid grid-cols-12 gap-5">
      <ApiNav
        className={clsx(
          "py-6",
          "pr-3 md:col-span-4 lg:col-span-3",
          "sticky align-start top-[4.75rem] h-[calc(100vh-108px)] overflow-y-auto overflow-x-hidden",
          "hidden md:block",
        )}
      />
      <Prose className="col-span-12 md:col-span-8 lg:col-span-9 py-6">
        {children}
      </Prose>
    </div>
  );
}
