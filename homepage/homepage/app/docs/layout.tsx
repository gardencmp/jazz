import { Prose } from "@/components/forMdx";
import { DocNav } from "@/components/docs/nav";

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
        <div className="relative flex flex-auto justify-center gap-x-12">
            <div className="sticky top-[4.75rem] h-[calc(100vh-6rem)] w-[16rem] overflow-y-auto overflow-x-hidden shrink-0 hidden lg:block bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300 p-4 rounded-xl prose-sm prose-ul:pl-1 prose-ul:ml-1 prose-li:my-2 prose-li:leading-tight prose-ul:list-['-']">
                <DocNav />
            </div>
            <div className="max-w-full">
                <Prose>{children}</Prose>
            </div>
        </div>
    );
}
