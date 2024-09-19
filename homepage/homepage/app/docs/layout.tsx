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
        <div>
            <div className="hidden md:block bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300 p-4 rounded-xl sticky overflow-y-scroll overscroll-contain w-[16rem] h-[calc(100dvh-8rem)] -mb-[calc(100dvh-8rem)] top-[6rem] mr-10 prose-sm prose-ul:pl-1 prose-ul:ml-1 prose-li:my-2 prose-li:leading-tight prose-ul:list-['-']">
                <DocNav />
            </div>
            <div className="md:ml-[20rem] text-base">
                <Prose>{children}</Prose>
            </div>
        </div>
    );
}
