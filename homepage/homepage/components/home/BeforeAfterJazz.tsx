import { H2 } from "gcmp-design-system/src/app/components/atoms/Headings";
import { CheckIcon, MoveDownIcon, MoveRightIcon, TriangleAlertIcon } from "lucide-react";
import { DiagramBeforeJazz } from "@/components/DiagramBeforeJazz";
import { DiagramAfterJazz } from "@/components/DiagramAfterJazz";

export default function BeforeAfterJazz() {
    return (
        <div className="container grid gap-4 lg:gap-8">
            <H2 className="text-center">Hard things are easy now.</H2>

            <div className="grid md:grid-cols-7 max-md:max-w-lg lg:max-w-8xl mx-auto gap-4 justify-items-stretch">
                <div className="col-span-3 flex flex-col gap-3 bg-stone-50 p-4 rounded-2xl md:p-8 md:pb-2 md:gap-5 dark:bg-stone-925">
                    <div className="leading-relaxed space-y-2">
                        <p>
                            Every stack reinvents users and
                            machines sharing state.
                        </p>

                        <p>
                            For each new app you
                            routinely tackle a mess of moving parts, tech
                            choices and deployment questions.
                        </p>
                        <p>And your code is all over the place.</p>
                    </div>
                    <div className="relative flex items-center flex-1">
                        <div className="w-20 h-full bg-gradient-to-r from-stone-50 to-transparent absolute top-0 left-0 z-10 dark:from-stone-925"></div>
                        <div className="h-20 w-full bg-gradient-to-b from-stone-50 to-transparent absolute top-0 left-0 z-10 dark:from-stone-925"></div>
                        <div className="h-20 w-full bg-gradient-to-t from-stone-50 to-transparent absolute bottom-0 left-0 z-10 dark:from-stone-925"></div>
                        <div className="w-20 h-full bg-gradient-to-l from-stone-50 to-transparent absolute top-0 right-0 z-10 dark:from-stone-925"></div>

                        <DiagramBeforeJazz className="mx-auto w-full h-auto max-w-md" />
                    </div>
                </div>
                <div className="col-span-3 md:col-span-1 flex items-center justify-center">
                    <MoveRightIcon size={32} className="hidden md:block" />
                    <MoveDownIcon size={32} className="block md:hidden" />
                </div>
                <div className="col-span-3 flex flex-col gap-3 bg-stone-50 p-4 rounded-2xl md:p-8 md:pb-2 md:gap-5 dark:bg-stone-925">
                    <div className="leading-relaxed space-y-2">
                        <p>
                            Jazz provides a single abstraction for the whole
                            job.
                        </p>
                        <p>
                            It turns the data flow around, with{" "}
                            <span className="font-medium text-stone-900 dark:text-white">
                                mutable local state
                            </span>{" "}
                            {" "}that’s{" "}
                            <span className="font-medium text-stone-900 dark:text-white">
                                instantly synced.
                            </span>{" "}Users & permissions?{" "}
                            <span className="font-medium text-stone-900 dark:text-white">
                            Built-in.
                            </span>
                        </p>
                        <p>
                            All that’s left?{" "}
                            <span className="font-medium text-stone-900 dark:text-white">
                                What makes your app your app.
                            </span>
                        </p>
                    </div>
                    <div className="flex items-center flex-1">
                        <DiagramAfterJazz className="mx-auto w-full h-auto max-w-md" />
                    </div>
                </div>
            </div>
        </div>
    );
}
