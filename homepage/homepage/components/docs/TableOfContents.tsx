import Link from "next/link";
import { clsx } from "clsx";

interface NavItem {
    name: string;
    href: string;
    items?: NavItem[];
}

export function TableOfContents({
    className,
    items,
}: {
    items: NavItem[];
    className?: string;
}) {
    if (!items.length) return null;

    return (
        <div
            className={clsx(
                "pl-3 sticky align-start top-[4.75rem] h-[calc(100vh-8rem)] overflow-y-auto overflow-x-hidden hidden md:block",
                className,
            )}
        >
            <p className="mb-3">On this page:</p>
            <ul className="space-y-2 text-sm list-disc pl-4">
                {items.map(({ name, href, items }) => (
                    <li key={name} className="space-y-2">
                        <Link href={href}>{name}</Link>
                        {items && items?.length > 0 && (
                            <ul className="list-disc pl-4 space-y-2">
                                {items.map(({ name, href }) => (
                                    <li key={href}>
                                        <Link href={href}>{name}</Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
