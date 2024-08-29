import { ReactNode } from "react";

export const heroHeadingProseClasses =
    "prose-h1:font-display prose-h1:text-5xl lg:prose-h1:text-6xl prose-h1:font-medium prose-h1:tracking-tighter";
export const heroHeadingClasses =
    "font-display text-5xl lg:text-6xl font-medium tracking-tighter";

export function HeroHeading(props: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <h1 className={[heroHeadingClasses, props.className || ""].join(" ")}>
            {props.children}
        </h1>
    );
}
