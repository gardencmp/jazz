import { H2 } from "gcmp-design-system/src/app/components/atoms/Headings";
import { MoveDownIcon, MoveRightIcon } from "lucide-react";
import { DiagramBeforeJazz } from "@/components/DiagramBeforeJazz";
import { DiagramAfterJazz } from "@/components/DiagramAfterJazz";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";

export default function BeforeAfterJazz() {
    return (
        <div className="container grid gap-4 lg:gap-8">
            <H2 className="text-center">Hard things are easy now.</H2>

            <div className="grid md:grid-cols-7 max-md:max-w-lg lg:max-w-8xl mx-auto gap-4 justify-items-stretch">
                <div className="col-span-3 flex flex-col gap-3 bg-stone-50 p-4 rounded-2xl md:p-8 md:gap-5 dark:bg-stone-925">
                    <Prose>
                        <p>
                            The sad truth:
                            <br />
                            <strong>
                                Every stack reinvents how users and machines
                                share state.
                            </strong>
                        </p>
                    </Prose>
                    <div className="relative flex items-center flex-1">
                        <div className="w-20 h-full bg-gradient-to-r from-stone-50 to-transparent absolute top-0 left-0 z-10 dark:from-stone-925"></div>
                        <div className="h-20 w-full bg-gradient-to-b from-stone-50 to-transparent absolute top-0 left-0 z-10 dark:from-stone-925"></div>
                        <div className="h-20 w-full bg-gradient-to-t from-stone-50 to-transparent absolute bottom-0 left-0 z-10 dark:from-stone-925"></div>
                        <div className="w-20 h-full bg-gradient-to-l from-stone-50 to-transparent absolute top-0 right-0 z-10 dark:from-stone-925"></div>

                        <DiagramBeforeJazz className="mx-auto w-full h-auto max-w-md" />
                    </div>
                    <Prose>
                        <p>
                            For each new app you tackle a{" "}
                            <strong>
                                mess of moving parts, tech choices &amp;
                                deployment woes.
                            </strong>{" "}
                            Your code? <strong>All over the place.</strong>
                        </p>
                        <p>
                            <strong>It’s holding you back</strong> from shipping{" "}
                            <strong>what your app could be.</strong>
                        </p>
                    </Prose>
                </div>
                <div className="col-span-3 md:col-span-1 flex items-center justify-center">
                    <MoveRightIcon
                        size={32}
                        className="hidden md:block text-stone-300 dark:text-stone-700"
                    />
                    <MoveDownIcon
                        size={32}
                        className="block md:hidden text-stone-300 dark:text-stone-700"
                    />
                </div>
                <div className="col-span-3 flex flex-col gap-3 bg-stone-50 p-4 rounded-2xl md:p-8 md:gap-5 dark:bg-stone-925">
                    <Prose>
                        <p>
                            The good news:
                            <br />
                            <strong>
                                There’s a single new abstraction that does the
                                whole job.
                            </strong>
                        </p>
                    </Prose>
                    <div className="flex items-center flex-1">
                        <DiagramAfterJazz className="mx-auto w-full h-auto max-w-md" />
                    </div>
                    <Prose>
                        <p>
                            Jazz gives you <strong>mutable local state</strong>{" "}
                            that’s <strong>instantly synced.</strong> Including
                            binary blobs.{" "}
                            <strong>
                                With users &amp; permissions built-in.
                            </strong>
                        </p>
                        <p>
                            All that’s left is{" "}
                            <strong>
                                building the UX that makes your app special.
                            </strong>
                        </p>
                    </Prose>
                </div>
            </div>
        </div>
    );
}
