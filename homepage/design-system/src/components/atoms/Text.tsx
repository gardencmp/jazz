import { cva, type VariantProps } from "class-variance-authority";
import clsx from "clsx";
// import { ThemeColors } from "@/styles/colors.type";
// this overwrites the text-* classes. DUH CN.
// import { cn } from "@/utils/shadcn-utils";

/* TODO: prose system from textVariants */

// HTML styles for titles
// https://tailwindcss.com/docs/hover-focus-and-other-states#using-arbitrary-variants
const titleStyles = [
  "[&_em]:font-serif [&_em]:tracking-[0] [&_em]:text-[112%]",
];

export const textVariants = cva([], {
  variants: {
    intent: {
      default: "",
      link: "link",
      markdown: "prose", // TBC
      body: "font-sans font-normal",
      heading: "font-sans font-medium",
      title: "font-display font-medium",
      display: "font-display font-medium",
    },
    size: {
      // default: "text-base",
      // inherit: "text-inherit",
      fine: "text-fine subpixel-antialiased",
      meta: "text-meta",
      small: "text-small",
      base: "text-base",
      large: "text-large",
      xlarge: "text-xlarge",
      subheading: "text-subheading",
      heading: "text-heading",
      subtitle: "text-subtitle",
      title: "text-title",
      super: "text-super",
    },
    // These must match button.tsx
    color: {
      default: "text-inherit",
      foreground: "text-foreground",
      background: "text-background",
      primary: "text-primary",
      "primary-f": "text-primary-foreground",
      secondary: "text-secondary",
      destructive: "text-destructive",
      solid: "text-solid",
      fill: "text-fill",
      "fill-contrast": "text-fill-contrast",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semi: "font-semibold",
      bold: "font-bold",
      extra: "font-extrabold",
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
    caps: {
      true: "uppercase",
    },
    inline: {
      true: "leading-none",
    },
    balance: {
      true: "text-balance",
    },
    bullet: {
      true: [
        // "relative before:content-['']",
        // "before:absolute before:inline-block before:bg-current",
        // "before:-left-[1.25em] before:top-[0.66em] before:h-[0.05em] before:w-[1em]",
        "list-disc",
      ],
    },
  },
  // Compound variants apply classes when multiple other variant conditions are met: https://cva.style/docs/getting-started/variants#compound-variants
  compoundVariants: [
    // {
    //   intent: "display",
    //   size: ["super", "title", "subtitle"],
    //   class: "text-super tracking-super",
    // },
    // {
    //   intent: "display",
    //   size: ["heading", "subheading", "xlarge", "large"],
    //   class: "text-heading tracking-heading",
    // },
    // {
    //   intent: "heading",
    //   class: "text-title tracking-super",
    // },
    // Apply classes when lead size and bold weight
    // Applied thus `button({ size: "lead", serif })`
    {
      caps: true,
      size: ["subheading", "heading"],
      class: "!tracking-[0.05em]",
    },
  ],
  defaultVariants: {
    intent: "body",
    size: "base",
    // color: "default",
    // weight: "normal",
    // align: "left",
  },
});

export interface TextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "color">,
    VariantProps<typeof textVariants> {
  as?: React.ElementType;
}

export const Text = ({
  as: Component = "p",
  className,
  intent,
  color,
  weight,
  align,
  size,
  caps,
  inline,
  balance,
  bullet,
  ...props
}: TextProps) => {
  if (Component === "li") {
    bullet = true;
  }

  return (
    <Component
      {...props}
      className={clsx(
        textVariants({
          intent,
          size,
          color,
          weight,
          align,
          caps,
          inline,
          balance,
          bullet,
          className,
        }),
        Component === "ul" ? "pl-[2em]" : "",
      )}
    >
      {/* {format ? formatText(children) : children} */}
      {props.children}
    </Component>
  );
};
