import {
  RiDashboardHorizontalFill,
  RiArchiveDrawerLine,
} from "@/components/icons";
import clsx from "clsx";
import { Theme } from "@/lib/types";

export const APICard = ({
  children,
  theme = "toolkit",
}: {
  children: React.ReactNode;
  theme?: Theme;
}) => (
  <div
    className={clsx(
      "col-span-4 bg-canvas px-4 pb-w4",
      "border rounded-lg overflow-hidden [&_.prose]:pt-w3",
      theme === "toolkit" && "border-accent  [&_.border-b]:border-accent",
      theme === "covalues" && "border-cov-fill [&_.border-b]:border-cov-fill",
    )}
  >
    {children}
  </div>
);

export const CardMetaHeading = ({
  children,
  icon: Icon = RiArchiveDrawerLine,
  iconSize = "small",
  theme = "toolkit",
}: {
  children: React.ReactNode;
  icon?: React.ElementType;
  iconSize?: "large" | "small";
  theme?: Theme;
}) => {
  return (
    <h3
      className={clsx(
        "Text-meta font-semibold flex items-center",
        iconSize === "large" ? "gap-3" : "gap-2",
        "-mx-w4 px-4 py-w3 border-b",
        theme === "toolkit" && "text-accent-fill bg-accent-background",
        theme === "covalues" && "text-cov-fill bg-cov-background",
      )}
    >
      <Icon
        className={clsx(
          "shrink-0 mt-[-0.02em]",
          iconSize === "large" ? "size-[2em]" : "size-[1.3em]",
        )}
      />
      {children}
    </h3>
  );
};
