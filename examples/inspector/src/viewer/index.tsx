import { CoID, LocalNode, RawCoValue } from "cojson";
import { Page } from "./page";
import { Breadcrumbs } from "./breadcrumbs";
import { usePagePath } from "./use-page-path";
import { PageInfo } from "./types";

export default function CoJsonViewer({
    defaultPath,
    node,
}: {
    defaultPath?: PageInfo[];
    node: LocalNode;
}) {
    const { path, addPages, goToIndex, goBack } = usePagePath(defaultPath);

    return (
        <div className="w-full h-screen bg-gray-100 p-4 overflow-hidden">
            <Breadcrumbs path={path} onBreadcrumbClick={goToIndex} />
            <div className="relative mt-4 h-[calc(100vh-6rem)]">
                {path.map((page, index) => (
                    <Page
                        key={`${page.coId}-${index}`}
                        coId={page.coId}
                        node={node}
                        name={page.name || page.coId}
                        onHeaderClick={goBack}
                        onNavigate={addPages}
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
