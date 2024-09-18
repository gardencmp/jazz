"use client";

import { App_tsx, ChatScreen_tsx } from "@/codeSamples/examples/chat/src";
import { useState } from "react";

export function ChatCodeExample() {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        {
            name: "app.tsx",
            content: <App_tsx />,
        },
        {
            name: "chatScreen.tsx",
            content: <ChatScreen_tsx />,
        },
    ];

    return (
        <div className="grid grid-cols-12 gap-4 my-16">
            <div className="col-span-8 shadow-sm bg-white border rounded-sm overflow-hidden">
                <div className="flex border-b">
                    {tabs.map((tab, index) => (
                        <div key={index}>
                            <button
                                key={index}
                                className={`${activeTab === index ? "border-indigo-500 bg-white text-stone-700" : "border-transparent text-stone-500 hover:text-stone-700"} -mb-px transition-colors px-3 pb-1 pt-1.5 block text-xs border-b-2 `}
                                onClick={() => setActiveTab(index)}
                            >
                                {tab.name}
                            </button>
                        </div>
                    ))}
                </div>
                <div className="bg-white">{tabs[activeTab].content}</div>
            </div>
        </div>
    );
}
