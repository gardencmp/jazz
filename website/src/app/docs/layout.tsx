import { Metadata } from "next";
// import { DocsNav, DocsNavList } from "@/components/nav";

export const metadata: Metadata = {
  title: "jazz - Docs",
  description: "Jazz Guide, FAQ & Docs.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
