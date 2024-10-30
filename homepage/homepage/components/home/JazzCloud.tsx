import { Button } from "gcmp-design-system/src/app/components/atoms/Button";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import { CheckIcon } from "lucide-react";
import Link from "next/link";

export function JazzCloud() {
    return (
        <div className="border-b bg-gradient-to-t from-blue-50/80 via-blue-50/50 via-30% to-blue-50/0 pt-6 pb-16 lg:pt-10 lg:pb-24">
            <div className="container grid gap-6">
                <h2 className="font-display text-stone-900 dark:text-white text-3xl md:text-4xl lg:text-5xl font-medium tracking-tighter">
                    Jazz Cloud
                </h2>

                <Prose size="lg">
                    <p>
                        Jazz Cloud is a real-time sync and storage
                        infrastructure that scales your Jazz app up to millions
                        of users. It gives you secure collaborative data on a
                        global scale from day one.{" "}
                        <strong>Easy setup, no configuration needed.</strong>
                    </p>
                </Prose>

                <ul className="grid gap-3">
                    {[
                        "Data and blob storage",
                        "No limits for public alpha",
                        "E2E encryption",
                    ].map((feature) => (
                        <li
                            key={feature}
                            className="flex items-center gap-2 text-stone-800 dark:text-stone-200"
                        >
                            <span className="text-blue p-1 rounded-full bg-blue-50 dark:text-blue-500 dark:bg-stone-900">
                                <CheckIcon size={16} />
                            </span>
                            {feature}
                        </li>
                    ))}
                </ul>

                <div>
                    <Button href="/cloud" variant="primary" size="lg">
                        Get started for free
                    </Button>
                </div>

                {/*<Prose size="sm">*/}
                {/*    <p>*/}
                {/*        You can rely on us, but you can also{" "}*/}
                {/*        <Link href="/">self-host</Link>.*/}
                {/*    </p>*/}
                {/*</Prose>*/}
            </div>
        </div>
    );
}
