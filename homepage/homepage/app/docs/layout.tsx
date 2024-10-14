import { DocNav } from "@/components/docs/nav";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import { cn } from "@/lib/utils";
import { Children } from "react";

export const metadata = {
    title: "jazz - Docs",
    description: "Jazz Guide & Docs.",
};

export default function DocsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="container relative grid grid-cols-12 gap-5 py-8">
            <DocNav />
            {children}
        </div>
    );
}
