import { DocNav } from "@/components/docs/nav";
import { clsx } from "clsx";

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
      <DocNav className="py-6" />
      <div
        className={clsx(
          "col-span-12 md:col-span-8 lg:col-span-9",
          "flex justify-center lg:gap-5",
        )}
      >
        {children}
      </div>
    </div>
  );
}
