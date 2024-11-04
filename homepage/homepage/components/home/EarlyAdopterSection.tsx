import { H2 } from "gcmp-design-system/src/app/components/atoms/Headings";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import { Button } from "gcmp-design-system/src/app/components/atoms/Button";

export function EarlyAdopterSection() {
    return (
        <div className="border rounded-xl shadow-sm p-4 md:py-16">
            <div className="lg:max-w-3xl md:text-center mx-auto space-y-6">
                <p className="uppercase text-blue tracking-widest text-sm font-medium dark:text-stone-400">
                    Become an early adopter
                </p>
                <H2>We&apos;ll help you build your next app with Jazz</H2>
                <Prose className="md:text-balance mx-auto">
                    <p>
                        It&apos;s early days, but we work hard every day to make
                        Jazz a great tool for our users.
                    </p>
                    <p>
                        We want to hear about what you&apos;re building, so we
                        can help you every step of the way. We&apos;ll
                        prioritize features that you need to succeed.
                    </p>
                </Prose>
                <div className="flex md:justify-center gap-3">
                    <Button
                        href="https://discord.gg/utDMjHYg42"
                        variant="primary"
                    >
                        Let&apos;s talk on Discord
                    </Button>
                    <Button href="/docs" variant="secondary">
                        Read <span className="sm:hidden">docs</span>{" "}
                        <span className="hidden sm:inline">documentation</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
