import { ReactNode } from "react";
import clsx from "clsx";
import { RiDashboardHorizontalFill } from "@/components/icons";

export function Grid({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={clsx(
        "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4",
        "mt-10 items-stretch",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function GridCard(props: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "col-span-2 p-4 [&>h4]:mt-0 [&>h3]:mt-0 [&>:last-child]:mb-0",
        "border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm",
        props.className,
      )}
    >
      {props.children}
    </div>
  );
}

export const CardMetaHeading = ({
  children,
  ...props
}: {
  children: ReactNode;
}) => {
  return (
    <h3 className={clsx("Text-meta flex items-center gap-1.5")} {...props}>
      <RiDashboardHorizontalFill className="" />
      {children}
    </h3>
  );
};
