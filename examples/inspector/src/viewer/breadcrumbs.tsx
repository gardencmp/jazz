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
        <div className="mb-4 z-20 relative bg-indigo-400/10 backdrop-blur-sm rounded-lg inline-flex px-3 py-2 whitespace-pre transition-all items-center space-x-1 min-h-10">
            <img
                src="jazz-logo.png"
                className="size-5 mr-1"
                onClick={() => onBreadcrumbClick(0)}
            />
            {path.map((page, index) => {
                // Skip the first page, as the logo acts as a breadcrumb
                if (index === 0) return null;

                return (
                    <span key={index}>
                        <span className="text-indigo-500/30">{" / "}</span>
                        <button
                            onClick={() => onBreadcrumbClick(index)}
                            className="text-indigo-700 hover:underline"
                        >
                            {page.name}
                        </button>
                    </span>
                );
            })}
        </div>
    );
};
