import {
    CodeExampleTabs as CodeExampleTabsClient,
    CodeExampleTabsProps,
} from "@/components/CodeExampleTabs";

import { CodeGroup as CodeGroupClient } from "gcmp-design-system/src/app/components/molecules/CodeGroup";

import { IframeHTMLAttributes } from "react";
import { ResponsiveIframe as ResponsiveIframeClient } from "./ResponsiveIframe";

export function ResponsiveIframe(
    props: IframeHTMLAttributes<HTMLIFrameElement> & { localSrc: string },
) {
    return <ResponsiveIframeClient {...props} />;
}

export function CodeExampleTabs(props: CodeExampleTabsProps) {
    return <CodeExampleTabsClient {...props} />;
}

export function CodeGroup(props: { children: React.ReactNode }) {
    return <CodeGroupClient {...props}></CodeGroupClient>;
}
