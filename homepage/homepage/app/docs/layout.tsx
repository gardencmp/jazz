import { Prose } from "@/components/forMdx";
import { DocNav } from "@/components/docs/nav";
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
        <div className="relative grid grid-cols-12 gap-x-8 py-8">
            <div
                className={cn(
                    "md:col-span-4 lg:col-span-3",
                    "sticky align-start top-[4.75rem] h-[calc(100vh-8rem)] overflow-y-auto overflow-x-hidden",
                    "bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300 p-4 rounded-xl",
                    "hidden md:block",
                    "prose-sm prose-ul:pl-1 prose-ul:ml-1 prose-li:my-2 prose-li:leading-tight prose-ul:list-['-']",
                )}
            >
                <DocNav />
            </div>
            <div className="col-span-12 md:col-span-8 lg:col-span-9">
                <Prose>{children}</Prose>
            </div>
        </div>
    );
}
