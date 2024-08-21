import clsx from "clsx";
import { ThemeIcon, Theme, getThemeTextClass } from "@/components/theme";
import { Link } from "@/components/ui/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowUpRightIcon } from "lucide-react";

type Props = {
  heading: string;
  subheading?: string;
  description: string | React.ReactNode;
  link: string;
  linkLabel?: string;
  children?: React.ReactNode;
  theme: Theme;
};

export const PackagesSection = ({
  heading,
  subheading,
  description,
  link,
  linkLabel = "View docs",
  children,
  theme,
}: Props) => (
  <>
    <div className="grid grid-cols-12 gap-w4">
      <div className="col-span-full ml-[-0.2em]">
        {/* <ThemeIcon
          theme={theme}
          className={clsx(
            "text-[1.5em] transform translate-y-[-1px]",
            getThemeTextClass(theme),
          )}
        /> */}
        <div className="flex">
          <header className="flex-1 shrink-0">
            <div className="lg:w-7/12">
              <h1 className="Text-subtitle text-fill-contrast !leading-[1.1]">
                {heading}
              </h1>
              <h2 className="Text-subtitle text-solid-hover !leading-[1.1] text-balance">
                {subheading}
              </h2>
            </div>
          </header>
          <Link
            href={link}
            className={clsx(
              buttonVariants({ variant: "default", size: "sm" }),
              theme === "covalues" && "bg-cov-fill hover:bg-cov-fill-contrast",
              theme === "toolkit" &&
                "bg-accent-fill hover:bg-accent-fill-contrast",
            )}
          >
            {linkLabel}
            <ArrowUpRightIcon className={clsx("size-em")} />
          </Link>
        </div>
      </div>
      <div className="col-span-full lg:col-span-8 text-base space-y-1">
        {description}
      </div>
    </div>
    <div className="grid grid-cols-12 gap-w4 pt-1">{children}</div>
  </>
);
