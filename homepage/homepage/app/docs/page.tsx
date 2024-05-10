import {
    Highlight,
    ClassOrInterface,
    PropDecl,
    ClassRef,
    PropRef,
    PropCategory,
    FnDecl,
    NewCoValueExplainer,
} from "@/components/docs/tags";
import { DocNav } from "@/components/docs/nav";
import { PackageDocs } from "@/components/docs/packageDocs";
import Guide from "./guide.mdx";

export default function Page() {
    return (
        <>
            <div className="hidden md:block bg-stone-100 dark:bg-stone-900 p-4 rounded-xl sticky overflow-y-scroll overscroll-contain w-[16rem] h-[calc(100dvh-8rem)] -mb-[calc(100dvh-8rem)] top-[6rem] mr-10 prose-sm prose-ul:pl-1 prose-ul:ml-1 prose-li:my-2 prose-li:leading-tight prose-ul:list-['-']">
                <DocNav />
            </div>

            <div className="md:ml-[20rem]">
                <Guide />

                <div className="xl:-mr-[calc(50vw-40rem)]">
                    <h1>API Reference</h1>

                    <p>
                        Note: this documentation is work in progress, so if
                        something seems wrong or is missing, please let us know
                        on Discord or open an issue on GitHub.
                    </p>

                    <PackageDocs package="jazz-tools" />
                    <PackageDocs package="jazz-react" />
                    <PackageDocs package="jazz-browser" />
                    <PackageDocs package="jazz-browser-media-images" />
                    <PackageDocs package="jazz-nodejs" />
                </div>
            </div>
        </>
    );
}
