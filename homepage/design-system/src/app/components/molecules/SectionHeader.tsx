import { ReactNode } from "react";
import { Text } from "../atoms";

export function SectionHeader({
  title,
  slogan,
}: {
  title: ReactNode;
  slogan: ReactNode;
}) {
  return (
    //   no mb-*, always hoist whitespace styles to the parent
    <hgroup className="space-y-0.5">
      <Text as="h2" intent="subheading">
        {title}
      </Text>
      {/* remove "max-w-4xl", hoist width styles to the parent */}
      <Text as="p" intent="lead" color="dim">
        {slogan}
      </Text>
    </hgroup>
  );
}
