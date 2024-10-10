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
        md: "py-2 px-3",
        lg: "md:text-lg  py-2 px-3 md:px-8 md:py-3",
    };

    const variantClasses = {
        primary:
            "bg-blue border-blue text-white font-medium bg-blue hover:bg-blue-800 hover:border-blue-800",
        secondary:
            "text-stone-900 border border-stone-200 font-medium hover:border-stone-300 dark:border-stone-900 dark:hover:border-stone-800 dark:text-white",
    };

    const classNames = clsx(
        className,
        "rounded-lg transition-colors",
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
