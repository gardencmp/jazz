import clsx from "clsx";
import { Card } from "../atoms/Card";
import { Icon } from "../atoms/Icon";
import { Prose } from "./Prose";

export function FeatureCard({
  label,
  icon,
  explanation,
  children,
  className,
}: {
  label: React.ReactNode;
  icon?: string;
  explanation?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={clsx(className, "p-4")}>
      {icon && (
        <Icon
          name={icon}
          className="text-blue p-1.5 rounded-lg bg-blue-50 dark:text-blue-500 dark:bg-stone-900 mb-2.5"
          size="3xl"
        />
      )}
      <div className="text-stone-900 font-medium md:text-base dark:text-stone-100 mb-2">
        {label}
      </div>
      {explanation && <Prose>{explanation}</Prose>}
      {children}
    </Card>
  );
}
