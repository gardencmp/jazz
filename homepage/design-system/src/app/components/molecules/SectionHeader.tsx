import { ReactNode } from "react";
import { H2 } from "../atoms/Headings";
import clsx from "clsx";
import { Prose } from "./Prose";

function H2Sub({ children }: { children: React.ReactNode }) {
    return (
        <Prose size="lg" className="max-w-3xl">
            {children}
        </Prose>
    );
}

export function SectionHeader({
    title,
    slogan,
    className,
}: {
    title: ReactNode;
    slogan: ReactNode;
    className?: string;
}) {
    return (
        <hgroup className={clsx(className, "space-y-4 mb-5")}>
            <H2>{title}</H2>
            <H2Sub>{slogan}</H2Sub>
        </hgroup>
    );
}
