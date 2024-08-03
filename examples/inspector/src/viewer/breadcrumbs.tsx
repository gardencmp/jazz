import React from "react";
import { PageInfo } from "./types";

interface BreadcrumbsProps {
    path: PageInfo[];
    onBreadcrumbClick: (index: number) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
    path,
    onBreadcrumbClick,
}) => {
    return (
        <div className="z-20 relative bg-indigo-400/10 backdrop-blur-sm rounded-lg inline-flex px-2 py-1 whitespace-pre transition-all items-center space-x-1 min-h-10">
            <button
                onClick={() => onBreadcrumbClick(-1)}
                className="flex items-center justify-center p-1 rounded-sm hover:bg-indigo-500/10 transition-colors"
                aria-label="Go to home"
            >
                <img src="jazz-logo.png" alt="Jazz Logo" className="size-5" />
            </button>
            {path.map((page, index) => {
                return (
                    <span
                        key={index}
                        className="inline-block first:pl-1 last:pr-1"
                    >
                        {index === 0 ? null : (
                            <span className="text-indigo-500/30">{" / "}</span>
                        )}
                        <button
                            onClick={() => onBreadcrumbClick(index)}
                            className="text-indigo-700 hover:underline"
                        >
                            {index === 0 ? page.name || "Root" : page.name}
                        </button>
                    </span>
                );
            })}
        </div>
    );
};
