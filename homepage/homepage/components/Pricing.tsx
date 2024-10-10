import { CircleCheckIcon } from "lucide-react";
import { Button } from "@/components/Button";
import { ComingSoonBadge } from "gcmp-design-system/src/app/components/atoms/ComingSoonBadge";

export function ListItem({
    variant = "blue",
    children,
}: {
    variant?: "gray" | "blue";
    children: React.ReactNode;
}) {
    const iconSize = 16;

    const iconVariants = {
        gray: (
            <CircleCheckIcon
                size={iconSize}
                className="text-stone-500 shrink-0"
            />
        ),
        blue: (
            <CircleCheckIcon
                size={iconSize}
                className="text-blue-500 dark:text-white shrink-0"
            />
        ),
    };

    return (
        <li className="inline-flex items-center gap-2 text-stone-800 dark:text-stone-200 py-2">
            {iconVariants[variant]}
            {children}
        </li>
    );
}

export function Pricing() {
    return (
        <div className="flex flex-col sm:max-w-lg mx-auto md:max-w-none md:flex-row md:items-start gap-4">
            <div className="md:flex-1 flex flex-col gap-3 overflow-hidden rounded-3xl p-6 shadow-lg shadow-gray-900/5 bg-white dark:bg-stone-925">
                <h3 className="font-semibold text-stone-900 text-lg dark:text-white">
                    Starter
                </h3>

                <p className="text-3xl font-light text-stone-900 dark:text-white">
                    $0
                    <span className="text-sm text-stone-600 dark:text-stone-500">
                        /mo
                    </span>
                </p>

                <ul className="flex flex-col divide-y text-sm lg:text-base dark:divide-stone-900">
                    <ListItem>Best-effort sync</ListItem>
                    <ListItem>Community support</ListItem>
                    <ListItem variant="gray">
                        <s className="text-stone-500">
                            20 monthly active users
                        </s>
                    </ListItem>
                    <ListItem variant="gray">
                        <s className="text-stone-500">1 GB storage</s>
                    </ListItem>
                </ul>
                <div className="md:mt-5 space-y-3">
                    <p className="text-xs">
                        Currently no enforced limits for public alpha.
                    </p>

                    <p className="text-xs">
                        Use your email address as API key.
                    </p>
                </div>
            </div>
            <div className="md:flex-1 flex flex-col gap-3 overflow-hidden rounded-3xl p-6 shadow-lg shadow-gray-900/5 bg-white dark:bg-stone-925">
                <div>
                    <h3 className="font-semibold text-stone-900 text-lg inline mr-2 dark:text-white">
                        Indie
                    </h3>
                    <ComingSoonBadge />
                </div>

                <p className="text-3xl font-light text-stone-900 dark:text-white">
                    $19
                    <span className="text-sm text-stone-600 dark:text-stone-500">
                        /mo
                    </span>
                </p>

                <ul className="flex flex-col divide-y text-sm lg:text-base dark:divide-stone-900">
                    <ListItem>Base-priority sync</ListItem>
                    <ListItem>Community support</ListItem>
                    <ListItem>1000 monthly active users</ListItem>
                    <ListItem>500GB storage</ListItem>
                </ul>

                <p className="text-sm">Extra usage</p>

                <ul className="flex flex-col divide-y text-sm lg:text-base dark:divide-stone-900">
                    <ListItem>$9 per additional 1000 MAUs</ListItem>
                    <ListItem>$9 per additional 500GB storage/mo</ListItem>
                </ul>
                <p className="text-xs">
                    For companies with &lt;$200k in annual revenue or
                    institutional funding.
                </p>
            </div>
            <div className="md:flex-1 flex flex-col gap-3 overflow-hidden rounded-3xl p-6 shadow-lg shadow-gray-900/5 bg-white dark:bg-stone-925 pb-6">
                <h3 className="font-semibold text-stone-900 text-lg dark:text-white">
                    Pro
                </h3>

                <p className="text-3xl font-light text-stone-900 dark:text-white">
                    <span className="text-lg font-medium">from {""}</span>
                    $1k
                    <span className="text-sm text-stone-600 dark:text-stone-500">
                        /mo
                    </span>
                </p>

                <ul className="flex flex-col divide-y text-sm lg:text-base dark:divide-stone-900">
                    <ListItem>High-priority sync</ListItem>
                    <ListItem>White-glove support</ListItem>
                    <ListItem>Unlimited monthly active users</ListItem>
                    <ListItem>Unlimited storage</ListItem>
                    <ListItem>SLAs, custom deployment, etc.</ListItem>
                    <ListItem>
                        Offer <code>sync.yourdomain.com</code>
                    </ListItem>
                </ul>

                <Button
                    href="https://cal.com/anselm-io/mesh-pro-intro"
                    size="lg"
                    className="md:mt-6"
                >
                    Book intro call
                </Button>
                <p className="text-xs md:mt-3">
                    Our team of devs and product specialists will get you going
                    for free. Then we&apos;ll make a bespoke deal.
                </p>
            </div>
        </div>
    );
}
