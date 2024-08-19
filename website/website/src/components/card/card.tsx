import { RiDashboardHorizontalFill } from "@/components/icons";
import clsx from "clsx";

export const APICard = ({ children }: { children: React.ReactNode }) => (
  <div
    className={clsx(
      "col-span-4 bg-canvas px-4 pb-w4",
      "border border-accent rounded-lg overflow-hidden",
      // "[&>h3]:-mx-4 [&>h3]:px-4 [&>h3]:pb-w3 [&>h3]:border-b",
      "[&_.prose]:pt-w3 [&_.border-b]:border-accent",
    )}
  >
    {children}
  </div>
);

export const CardMetaHeading = ({
  children,
  icon: Icon = RiDashboardHorizontalFill,
  iconSize = "small",
}: {
  children: React.ReactNode;
  icon?: React.ElementType;
  iconSize?: "large" | "small";
}) => {
  return (
    <h3
      className={clsx(
        "Text-meta font-semibold flex items-center",
        iconSize === "large" ? "gap-3" : "gap-2",
        "-mx-w4 px-4 py-w3 border-b",
        "text-accent-fill bg-accent-backgroun",
      )}
    >
      <Icon
        className={clsx(
          "shrink-0 mt-[-0.02em]",
          iconSize === "large" && "size-[2em]",
        )}
      />
      {children}
    </h3>
  );
};
