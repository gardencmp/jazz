import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Prose className="container w-full max-w-full col-span-12 md:col-span-8 lg:col-span-9">
      {children}
    </Prose>
  );
}
