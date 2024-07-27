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
        <div className="mb-4 z-20 relative bg-indigo-400/10 backdrop-blur-sm rounded-lg inline-flex px-3 py-2 whitespace-pre transition-all items-center">
            <img
                src="jazz-logo.png"
                className="h-5 mr-2"
                onClick={() => onBreadcrumbClick(0)}
            />
            {path.map((page, index) => (
                <span key={index}>
                    <button
                        onClick={() => onBreadcrumbClick(index)}
                        className="text-indigo-700 hover:underline"
                    >
                        {page.name}
                    </button>
                    <span className="text-indigo-500/30">
                        {index < path.length - 1 && " / "}
                    </span>
                </span>
            ))}
        </div>
    );
};
