import { DocNav } from "@/components/docs/nav";
import { PackageDocs } from "@/components/docs/packageDocs";
import Guide from "./guide.mdx";
import { Prose } from "@/components/forMdx";

export const metadata = {
    title: "jazz - Docs",
    description: "Jazz Guide, FAQ & Docs.",
};

export default function Page() {
    return (
        <>
            <div className="hidden md:block bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300 p-4 rounded-xl sticky overflow-y-scroll overscroll-contain w-[16rem] h-[calc(100dvh-8rem)] -mb-[calc(100dvh-8rem)] top-[6rem] mr-10 prose-sm prose-ul:pl-1 prose-ul:ml-1 prose-li:my-2 prose-li:leading-tight prose-ul:list-['-']">
                <DocNav />
            </div>

            <div className="md:ml-[20rem] text-base">
                <Prose className="prose">
                    <Guide />

                    <h1 id="faq">FAQ</h1>

                    <p>
                        <span className="text-amber-500">
                            🚧 OH NO - We don&apos;t have any FAQ yet. 🚧
                        </span>{" "}
                        {"->"}{" "}
                        <a href="https://github.com/gardencmp/jazz/issues/187">
                            Complain on GitHub
                        </a>
                    </p>
                </Prose>

                <div className="xl:-mr-[calc(50vw-40rem)]">
                    <Prose>
                        <h1>API Reference</h1>

                        <p>
                            <span className="text-amber-500">
                                🚧 OH NO - These docs are still highly
                                work-in-progress. 🚧
                            </span>{" "}
                            {"->"}{" "}
                            <a href="https://github.com/gardencmp/jazz/issues/188">
                                Complain on GitHub
                            </a>
                        </p>
                    </Prose>

                    <div className="text-stone-800 dark:text-stone-200">
                    <PackageDocs package="jazz-tools" />
                    <PackageDocs package="jazz-react" />
                    <PackageDocs package="jazz-browser" />
                    <PackageDocs package="jazz-browser-media-images" />
                    <PackageDocs package="jazz-nodejs" />
                    </div>
                </div>
            </div>
        </>
    );
}
