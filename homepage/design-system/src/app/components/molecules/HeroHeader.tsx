import { ReactNode } from "react";
import { H1 } from "../atoms/Headings";
import clsx from "clsx";

function H1Sub({ children }: { children: React.ReactNode }) {
    return (
        <p
            className="text-lg text-pretty leading-relaxed max-w-3xl dark:text-stone-200 md:text-xl"
        >
            {children}
        </p>
    );
}

export function HeroHeader({
    title,
    slogan,
    pt = true,
}: {
    title: ReactNode;
    slogan: ReactNode;
    pt?: boolean;
}) {
    return (
        <hgroup className={clsx(pt && "pt-12 md:pt-20", "mb-10")}>
            <H1>{title}</H1>
            <H1Sub>{slogan}</H1Sub>
        </hgroup>
    );
}
