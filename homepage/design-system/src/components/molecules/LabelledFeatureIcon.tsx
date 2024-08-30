import { cx } from "class-variance-authority";
import clsx from "clsx";
import { LucideIcon } from "lucide-react";
import { Text } from "@atoms";

// CF: This component is used only once. I don't think it should be in the DS.
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
        "flex flex-col items-center justify-center gap-2",
        // use a clamp spacer for automatic responsiveness
        "p-w4",
        // This component is not contained within Prose, so no need to reset.  And text-base will be inherited from the body styles
        // "not-prose text-base",
        // This component is only used once and when it is, the border radius and border are overwritten. So turn them off here.
        // "border border-stone-200 dark:border-stone-800 rounded-xl",
      )}
    >
      <div
        className={cx(
          // no internal margin, no need for any mr at all
          // use the semantic design system colours
          // "mr-2 text-stone-500",
          "text-border-hover mx-auto",
        )}
      >
        <Icon strokeWidth={1} strokeLinecap="butt" size={40} />
      </div>
      {/* <div className="text-stone-700 dark:text-stone-300">{label}</div> */}
      <Text color="solid" weight="medium" align="center">
        {label}
      </Text>
    </div>
  );
}
