import clsx from "clsx";
import { ThemeIcon } from "../theme";
import { Theme } from "@/components/theme";

export const Card = ({
  children,
  theme = "toolkit",
}: {
  children: React.ReactNode;
  theme?: Theme;
}) => (
  <div
    className={clsx(
      "col-span-4 bg-[white] px-4 pb-w4",
      "rounded-lg overflow-hidden [&_.prose]:pt-w3",
      // "border border-black-a4 [&_.border-b]:border-black-a4",
      "border",
      theme === "toolkit" && "border-accent [&_.border-b]:border-accent",
      theme === "covalues" &&
        "border-cov-fill [&_.border-b]:border-cov-fill [&_.prose_h4_.sh__token--class]:text-cov-fill",
    )}
  >
    {children}
  </div>
);

type CardHeadingProps = {
  children: React.ReactNode;
  Icon?: React.ReactNode;
  iconSize?: "large" | "small";
  theme?: Theme;
  className?: string;
};

export const CardHeading = ({
  children,
  Icon,
  iconSize,
  theme = "toolkit",
  className,
}: CardHeadingProps) => {
  return (
    <h3
      className={clsx(
        "Text-meta font-semibold flex items-center",
        "-mx-w4 px-4 py-w3 border-b",
        iconSize === "large"
          ? "gap-3 [&_svg]:size-[2em]"
          : "gap-2 [&_svg]:!size-[1.25em]",
        theme === "toolkit" && "text-accent-fill bg-accent-background-active",
        theme === "covalues" && "text-cov-fill bg-cov-background",
        className,
      )}
    >
      {Icon}
      {children}
    </h3>
  );
};

export const CardMetaHeading = ({
  children,
  iconSize = "small",
  theme = "toolkit",
}: CardHeadingProps) => {
  return (
    <CardHeading
      iconSize={iconSize}
      theme={theme}
      Icon={
        <ThemeIcon theme={theme} className={clsx("shrink-0 mt-[-0.02em]")} />
      }
    >
      {children}
    </CardHeading>
  );
};
