import { notFound } from "next/navigation";
import { Link } from "@/components/ui/link";
import { getDocPosts } from "@/lib/mdx-utils";
import clsx from "clsx";
import { PixelarticonsFileAlt, PixelarticonsClock } from "@/components/icons";
import {
  ClockIcon,
  CaretRightIcon,
  ArrowTopRightIcon,
  GitHubLogoIcon,
  CubeIcon,
} from "@radix-ui/react-icons";
import { File, Pre, Code } from "@/components/mdx/mdx-components";
// import { Theme } from "@/lib/types";

type ItemProps = {
  heading: string;
  description: string;
  link: string;
  theme?: "code" | "package";
  className?: string;
};

export const CardSecondary = ({
  heading,
  description,
  link,
  theme = "code",
  className,
}: ItemProps) => {
  const isCode = theme === "code";

  return (
    <Link
      key={link}
      href={link}
      className={clsx(
        "relative group",
        // "px-w10 py-w8",
        "px-w4 py-w3 text-fill-contrast",
        "flex flex-col gap-inset rounded-lg",
        "transition-colors duration-200",
        isCode
          ? "bg-background hover:bg-background-active"
          : "bg-accent-background hover:bg-accent-background-active",
        className,
      )}
    >
      <div className={clsx("mt-auto", isCode ? "space-y-1" : "space-y-2")}>
        <h2
          className={clsx(
            "flex items-center",
            isCode ? "Text-subheading" : "Text-heading text-accent-fill",
          )}
        >
          {heading}
          {!isCode && <HeadingLinkCaret />}
        </h2>
        <div className="text-small">{description}</div>
      </div>

      {/* metas */}
      <div className="absolute inset-x-w4 right-w3 flex justify-between">
        <div
          className={clsx(
            "Text-meta leading-none flex items-center gap-1.5",
            isCode ? "text-fill-contrast" : "text-accent-fill",
          )}
        >
          {isCode ? (
            <GitHubLogoIcon className="size-em" />
          ) : (
            <CubeIcon className="size-em" />
          )}
          <span className="text-code">{isCode ? "Code" : "Package"}</span>
        </div>
        {isCode && (
          <ArrowTopRightIcon className="size-[1.25em] opacity-30 group-hover:opacity-100 transition-all" />
        )}
      </div>
    </Link>
  );
};

export const HeadingLinkCaret = () => (
  <CaretRightIcon
    className={clsx(
      "size-em opacity-0 translate-x-0 transition-all",
      "group-hover:opacity-100 group-hover:translate-x-1",
    )}
  />
);
