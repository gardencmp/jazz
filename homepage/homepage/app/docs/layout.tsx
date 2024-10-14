import { DocNav } from "@/components/docs/nav";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import { cn } from "@/lib/utils";

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
        <div className="container relative grid grid-cols-12 gap-x-8 py-8">
            <DocNav
                className={cn(
                    "pr-3 md:col-span-4 lg:col-span-3",
                    "sticky align-start top-[4.75rem] h-[calc(100vh-8rem)] overflow-y-auto overflow-x-hidden",
                    "hidden md:block",
                )}
            />
            <div className="col-span-12 md:col-span-8 lg:col-span-9">
                <Prose>{children}</Prose>
            </div>
        </div>
    );
}
