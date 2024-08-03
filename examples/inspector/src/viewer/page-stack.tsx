import { Page } from "./page"; // Assuming you have a Page component
import { CoID, LocalNode, RawCoValue } from "cojson";

// Define the structure of a page in the path
interface PageInfo {
    coId: CoID<RawCoValue>;
    name?: string;
}

// Props for the PageStack component
interface PageStackProps {
    path: PageInfo[];
    node?: LocalNode | null;
    goBack: () => void;
    addPages: (pages: PageInfo[]) => void;
    children?: React.ReactNode;
}

export function PageStack({
    path,
    node,
    goBack,
    addPages,
    children,
}: PageStackProps) {
    return (
        <div className="relative mt-4 h-[calc(100vh-6rem)]">
            {children && (
                <div className="absolute inset-0 pb-20">{children}</div>
            )}
            {node &&
                path.map((page, index) => (
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
    );
}
