import { cva, cx, type VariantProps } from "class-variance-authority";

const displayStyle = "font-display font-semibold";
const headingStyle = "font-sans font-medium";
const paragraphStyle = "font-sans font-normal";
// const monoStyle = "font-mono font-medium";

export const textVariants = cva([], {
  variants: {
    intent: {
      default: "",
      link: "link",
      markdown: "prose", // TBC
      fine: [paragraphStyle, "text-fine subpixel-antialiased"],
      // TODO: metaHeading: [monoStyle]
      body: [paragraphStyle, "text-base"],
      lead: [headingStyle, "text-lead"],
      subheading: [displayStyle, "text-subheading"],
      heading: [displayStyle, "text-heading"],
      subtitle: [displayStyle, "text-subtitle"],
      title: [displayStyle, "text-title"],
      super: [displayStyle, "text-super"],
    },
    color: {
      feint: "text-line",
      dim: "text-solid",
      default: "text-fill",
      destructive: "text-destructive",
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
    inline: {
      true: "leading-none",
    },
    balance: {
      true: "text-balance",
    },
    bullet: {
      true: ["list-disc"],
    },
  },
  // Compound variants apply classes when multiple other variant conditions are met: https://cva.style/docs/getting-started/variants#compound-variants
  compoundVariants: [
    // EXAMPLE:
    // {
    //   intent: "display",
    //   size: ["super", "title", "subtitle"],
    //   class: "text-super tracking-super",
    // },
  ],
  // I find the less that is defaulted and the more inherited from the body element's typographic settings, the less property assignment is required. Let's wait & see what are needs are.
  defaultVariants: {
    // intent: "body",
    // color: "default",
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
  align,
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
      className={cx(
        textVariants({
          intent,
          color,
          align,
          inline,
          balance,
          bullet,
          className,
        }),
        Component === "ul" ? "pl-[2em]" : ""
      )}
    >
      {/* {format ? formatText(children) : children} */}
      {props.children}
    </Component>
  );
};
