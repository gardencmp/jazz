import clsx from "clsx";
import { LucideIcon } from "lucide-react";

export function LabelledFeatureIcon({
    label,
    icon: Icon,
}: {
    label: string;
    icon: LucideIcon;
}) {
    return (
        <div
            className={clsx(
                "p-4 flex flex-col items-center justify-center gap-2",
                "not-prose text-base",
                "border border-stone-200 dark:border-stone-800 rounded-xl"
            )}
        >
            <div className="text-stone-500 mr-2">
                <Icon strokeWidth={1} strokeLinecap="butt" size={40} />
            </div>
            <div className="text-sm text-stone-700 md:text-base dark:text-stone-300">
                {label}
            </div>
        </div>
    );
}
