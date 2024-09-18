"use client";

import { useState } from "react";
import { clsx } from "clsx";

interface CodeExampleTab {
    name: string;
    content: React.ReactNode;
}

export interface CodeExampleTabsProps {
    tabs: Array<CodeExampleTab>;
    className?: string;
}

export function CodeExampleTabs({
    tabs,
    className = "",
}: CodeExampleTabsProps) {
    const [activeTab, setActiveTab] = useState(0);

    return (
        <div
            className={clsx(
                "shadow-sm bg-white border rounded-sm overflow-hidden h-full flex flex-col",
                className,
            )}
        >
            <div className="flex border-b">
                {tabs.map((tab, index) => (
                    <div key={index}>
                        <button
                            key={index}
                            className={clsx(
                                activeTab === index
                                    ? "border-indigo-500 bg-white text-stone-700"
                                    : "border-transparent text-stone-500 hover:text-stone-700",
                                "flex items-center -mb-px transition-colors px-3 pb-1.5 pt-2 block text-xs border-b-2 ",
                            )}
                            onClick={() => setActiveTab(index)}
                        >
                            {tab.name}
                        </button>
                    </div>
                ))}
            </div>
            <div className="flex-1">{tabs[activeTab].content}</div>
        </div>
    );
}
