import clsx from "clsx";
import { LucideIcon } from "lucide-react";

export function LabelledFeatureIcon({
    label,
    icon: Icon,
    explanation
}: {
    label: string;
    icon: LucideIcon;
    explanation: React.ReactNode;
}) {
    return (
        <div
            className={clsx(
                "py-5 flex flex-col gap-3",
                "not-prose text-base",
                // "border border-stone-200 dark:border-stone-900 rounded-xl"
            )}
        >
            <div className="flex items-center gap-2">
                <Icon  className="text-stone-900 dark:text-stone-100" strokeWidth={1.5} strokeLinecap="butt" size={25} />
                <div className="text-stone-900 text-base md:text-lg dark:text-stone-100">
                    {label}
                </div>
            </div>
            <div className="leading-relaxed space-y-3 text-sm">
                {explanation}
            </div>
        </div>
    );
}
