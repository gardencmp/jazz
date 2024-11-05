import { DocNav } from "@/components/docs/nav";
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
        <div className="container relative grid grid-cols-12 gap-5 py-8">
            <DocNav />
            <Prose className="md:col-span-8 lg:col-span-9">{children}</Prose>
        </div>
    );
}
