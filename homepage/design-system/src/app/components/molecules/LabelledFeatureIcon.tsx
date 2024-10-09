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
                "p-4 flex flex-col gap-3",
                "not-prose text-base",
                "border border-stone-200 dark:border-stone-900 rounded-xl"
            )}
        >
            <div>
                <Icon  className="text-stone-500" strokeWidth={1} strokeLinecap="butt" size={40} />
            </div>
            <div className="text-stone-900 font-medium md:text-base dark:text-stone-100">
                {label}
            </div>
            <div className="leading-relaxed space-y-3 text-sm">
                {explanation}
            </div>
        </div>
    );
}
