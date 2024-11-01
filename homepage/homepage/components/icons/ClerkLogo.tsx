import React from "react";
import type { SVGProps } from "react";
import { clsx } from "clsx";

export function ClerkLogo(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            className={clsx(props.className, "text-black dark:text-white")}
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
        >
            <path
                fill="currentColor"
                d="m21.47 20.829l-2.881-2.881a.57.57 0 0 0-.7-.084a6.85 6.85 0 0 1-7.081 0a.576.576 0 0 0-.7.084l-2.881 2.881a.576.576 0 0 0-.103.69a.6.6 0 0 0 .166.186a12 12 0 0 0 14.113 0a.58.58 0 0 0 .239-.423a.58.58 0 0 0-.172-.453m.002-17.668l-2.88 2.88a.57.57 0 0 1-.701.084A6.857 6.857 0 0 0 8.724 8.08a6.86 6.86 0 0 0-1.222 3.692a6.86 6.86 0 0 0 .978 3.764a.57.57 0 0 1-.083.699l-2.881 2.88a.567.567 0 0 1-.864-.063A11.993 11.993 0 0 1 6.771 2.7a11.99 11.99 0 0 1 14.637-.405a.57.57 0 0 1 .232.418a.57.57 0 0 1-.168.448m-7.118 12.261a3.427 3.427 0 1 0 0-6.854a3.427 3.427 0 0 0 0 6.854"
            />
        </svg>
    );
}
