import { H2 } from "gcmp-design-system/src/app/components/atoms/Headings";
import { CheckIcon, TriangleAlertIcon } from "lucide-react";
import { DiagramBeforeJazz } from "@/components/DiagramBeforeJazz";
import { DiagramAfterJazz } from "@/components/DiagramAfterJazz";

export default function BeforeAfterJazz() {
    return (
        <div className="container grid gap-4 lg:gap-8">
            <H2 className="md:text-center">Hard things are easy now.</H2>

            <div className="grid sm:grid-cols-2 lg:max-w-5xl mx-auto gap-4">
                <div className="flex flex-col gap-3 bg-stone-50 p-4 rounded-2xl md:p-8 md:pb-2 md:gap-5 dark:bg-stone-925">
                    <span className="text-red-600 bg-red-100 inline-flex items-center justify-center size-10 rounded-full dark:bg-stone-900 dark:text-red-500">
                        <TriangleAlertIcon size={24} />
                    </span>
                    <div className="leading-relaxed space-y-2">
                        <p>
                            Every stack just reinvents shared state between
                            users and machines.
                        </p>

                        <p>
                            And far from the simple client-server model, you
                            routinely tackle a mess of moving parts, tech
                            choices and deployment questions.
                        </p>
                        <p>And your app’s code is all over the place.</p>
                    </div>
                    <div className="relative flex items-center flex-1">
                        <div className="w-20 h-full bg-gradient-to-r from-stone-50 to-transparent absolute top-0 left-0 z-10 dark:from-stone-925"></div>
                        <div className="h-20 w-full bg-gradient-to-b from-stone-50 to-transparent absolute top-0 left-0 z-10 dark:from-stone-925"></div>
                        <div className="h-20 w-full bg-gradient-to-t from-stone-50 to-transparent absolute bottom-0 left-0 z-10 dark:from-stone-925"></div>
                        <div className="w-20 h-full bg-gradient-to-l from-stone-50 to-transparent absolute top-0 right-0 z-10 dark:from-stone-925"></div>

                        <DiagramBeforeJazz className="w-full h-auto max-w-md" />
                    </div>
                </div>
                <div className="flex flex-col gap-3 bg-stone-50 p-4 rounded-2xl md:p-8 md:pb-2 md:gap-5 dark:bg-stone-925">
                    <span className="text-green-500 bg-green-100 inline-flex items-center justify-center size-10 rounded-full dark:bg-stone-900 dark:text-green-500">
                        <CheckIcon size={24} />
                    </span>
                    <div className="leading-relaxed space-y-2">
                        <p>
                            Jazz provides a single new abstraction to do the
                            whole job.
                        </p>
                        <p>
                            It turns the data flow around and gives you{" "}
                            <span className="font-medium text-stone-900 dark:text-white">
                                mutable local state
                            </span>
                            , solving{" "}
                            <span className="font-medium text-stone-900 dark:text-white">
                                sync
                            </span>
                            ,{" "}
                            <span className="font-medium text-stone-900 dark:text-white">
                                concurrent editing
                            </span>{" "}
                            and{" "}
                            <span className="font-medium text-stone-900 dark:text-white">
                                permissions
                            </span>{" "}
                            under the hood.
                        </p>
                        <p>
                            All that’s left?{" "}
                            <span className="font-medium text-stone-900 dark:text-white">
                                What makes your app your app.
                            </span>
                        </p>
                    </div>
                    <div className="flex items-center flex-1">
                        <DiagramAfterJazz className="w-full h-auto max-w-md" />
                    </div>
                </div>
            </div>
        </div>
    );
}
