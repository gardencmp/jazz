import { clsx } from "clsx";
import Link from "next/link";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: "primary" | "secondary";
    size?: "md" | "lg";
    href?: string;
}

export function Button(props: ButtonProps) {
    const {
        type = "button",
        className,
        children,
        size = "md",
        variant = "primary",
        href,
    } = props;

    const sizeClasses = {
        md: "py-1.5 px-3",
        lg: "md:text-lg  py-2 px-3 md:px-8 md:py-3",
    };

    const variantClasses = {
        primary: "bg-blue text-white font-medium bg-blue hover:bg-blue-800",
        secondary:
            "text-stone-900 font-medium bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:text-white",
    };

    const classNames = clsx(
        className,
        "rounded-md transition-colors",
        sizeClasses[size],
        variantClasses[variant],
    );

    if (href) {
        return (
            <Link href={href} className={classNames}>
                {children}
            </Link>
        );
    }

    return (
        <button
            className={clsx(
                className,
                sizeClasses[size],
                variantClasses[variant],
            )}
            {...props}
        >
            {children}
        </button>
    );
}
