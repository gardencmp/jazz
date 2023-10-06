export function Slogan(props: { children: React.ReactNode; small?: boolean }) {
    return (
        <div
            className={
                "leading-snug mb-5 max-w-3xl text-neutral-700 dark:text-neutral-200 " +
                (props.small ? "text-lg mt-2" : "text-2xl mt-5")
            }
        >
            {props.children}
        </div>
    );
}

export function Grid(props: { children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-10 items-stretch">
            {props.children}
        </div>
    );
}

export function GridItem(props: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={
                (props.className || "") +
                " [&>.nextra-code-block]:h-full [&>.nextra-code-block>pre]:h-full [&>.nextra-code-block>pre]:mb-0"
            }
        >
            {props.children}
        </div>
    );
}

export function GridCard(props: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={
                "border border-stone-200 dark:border-stone-500 rounded-xl p-4 [&>h4]:mt-0 [&>h3]:mt-0 " +
                props.className
            }
        >
            {props.children}
        </div>
    );
}

export function GoogleLogo() {
    return (
        <svg
            className="w-3 h-3 inline align-baseline"
            viewBox="0 0 950 950"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M915.2 448l-4.2-17.8H524V594h231.2c-24 114-135.4 174-226.4 174-66.2 0-136-27.8-182.2-72.6-47.4-46-77.6-113.8-77.6-183.6 0-69 31-138 76.2-183.4 45-45.2 113.2-70.8 181-70.8 77.6 0 133.2 41.2 154 60l116.4-115.8c-34.2-30-128-105.6-274.2-105.6-112.8 0-221 43.2-300 122C144.4 295.8 104 408 104 512s38.2 210.8 113.8 289c80.8 83.4 195.2 127 313 127 107.2 0 208.8-42 281.2-118.2 71.2-75 108-178.8 108-287.6 0-45.8-4.6-73-4.8-74.2z"
                fill="currentColor"
            />
        </svg>
    );
}

import { IframeHTMLAttributes } from 'react';
import { ResponsiveIframe as ResponsiveIframeClient } from './ResponsiveIframe';

export function ResponsiveIframe(props: IframeHTMLAttributes<HTMLIFrameElement>) {
    return <ResponsiveIframeClient {...props} />;
}
