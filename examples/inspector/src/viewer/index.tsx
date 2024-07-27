import { CoID, LocalNode, RawCoValue } from "cojson";
import { useState } from "react";
import { PageInfo } from "./types";
import { Page } from "./page";
import { Breadcrumbs } from "./breadcrumbs";

export default function CoJsonViewer({
    coValueId,
    node,
}: {
    coValueId: CoID<RawCoValue>;
    node: LocalNode;
}) {
    const [path, setPath] = useState<PageInfo[]>([
        { coId: coValueId, name: "Root" },
    ]);

    const handleNavigate = (newPages: PageInfo[]) => {
        setPath([...path, ...newPages]);
    };

    const handleBreadcrumbClick = (index: number) => {
        setPath(path.slice(0, index + 1));
    };

    const handlePageClick = () => {
        if (path.length === 1) return;
        setPath(path.slice(0, path.length - 1));
    };

    return (
        <div className="w-full h-screen bg-gray-100 p-4 overflow-hidden">
            <Breadcrumbs
                path={path}
                onBreadcrumbClick={handleBreadcrumbClick}
            />
            <div className="relative mt-4 h-[calc(100vh-6rem)]">
                {path.map((page, index) => (
                    <Page
                        key={`${page.coId}-${index}`}
                        coId={page.coId}
                        node={node}
                        name={page.name}
                        onHeaderClick={handlePageClick}
                        onNavigate={handleNavigate}
                        isTopLevel={index === path.length - 1}
                        style={{
                            transform: `translateZ(${(index - path.length + 1) * 200}px) scale(${
                                1 - (path.length - index - 1) * 0.05
                            }) translateY(${-(index - path.length + 1) * -4}%)`,
                            opacity: 1 - (path.length - index - 1) * 0.05,
                            zIndex: index,
                            transitionProperty: "transform, opacity",
                            transitionDuration: "0.3s",
                            transitionTimingFunction: "ease-out",
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
