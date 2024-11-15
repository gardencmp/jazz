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
  return <Prose className="py-6 overflow-x-hidden lg:flex-1">{children}</Prose>;
}
