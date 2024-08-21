import clsx from "clsx";
import { Theme, getThemeTextClass } from "../theme";

export const Badge = ({
  children,
  theme = "default",
  className,
  ...props
}: {
  children: React.ReactNode;
  theme?: Theme;
  className?: string;
}) => {
  return (
    <span
      className={clsx(
        "not-prose Text-meta !text-[0.65em] !leading-[0.8] !font-normal",
        // px-[4px] py-[2px]
        "rounded-full px-[0.75em] py-[0.3em] border inline-block",
        "transform translate-y-[-0.1em]",
        theme === "default" && "!text-fill border-line bg-[rgb(0_0_0_/_0.025)]",
        theme === "toolkit" && "!text-accent-fill border-accent-border",
        theme === "covalues" && "!text-cov-fill !border-cov-border",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
};
