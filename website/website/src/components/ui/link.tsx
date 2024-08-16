import NextLink from "next/link";
import React, { AnchorHTMLAttributes } from "react";

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
}

export const Link: React.FC<LinkProps> = ({ href, children, ...props }) => {
    const isExternal = /^(https?:)?\/\/|mailto:/.test(href);

    return isExternal ? (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
            {children}
        </a>
    ) : (
        <NextLink href={href} {...props}>
            {children}
        </NextLink>
    );
};
