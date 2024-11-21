export interface ContentByFrameworkProps {
  framework: string;
  children: React.ReactNode;
}

/**
 * Example:
 * <ContentByFramework framework="react">
 *   content visible only if React is the selected framework
 * </ContentByFramework>
 */

export function ContentByFramework(props: {
  framework: string;
  children: React.ReactNode;
}) {
  const framework = "react";

  if (framework == props.framework) {
    return props.children;
  }
}
