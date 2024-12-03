import {
  CodeExampleTabs as CodeExampleTabsClient,
  CodeExampleTabsProps,
} from "@/components/CodeExampleTabs";

import {
  ContentByFramework as ContentByFrameworkClient,
  ContentByFrameworkProps,
} from "@/components/docs/ContentByFramework";
import { CodeGroup as CodeGroupClient } from "gcmp-design-system/src/app/components/molecules/CodeGroup";
import { ComingSoon as ComingSoonClient } from "./docs/ComingSoon";

export function CodeExampleTabs(props: CodeExampleTabsProps) {
  return <CodeExampleTabsClient {...props} />;
}

export function CodeGroup(props: { children: React.ReactNode }) {
  return <CodeGroupClient {...props}></CodeGroupClient>;
}

export function ComingSoon() {
  return <ComingSoonClient />;
}

export function ContentByFramework(props: ContentByFrameworkProps) {
  return <ContentByFrameworkClient {...props}></ContentByFrameworkClient>;
}
