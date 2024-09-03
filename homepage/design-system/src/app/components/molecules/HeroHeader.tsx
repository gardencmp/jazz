import { ReactNode } from "react";
import { Text } from "../atoms";

export function HeroHeader({
  title,
  slogan,
}: {
  title: ReactNode;
  slogan: ReactNode;
}) {
  return (
    // prefer header over hgroup? I prefer to avoid semantic HTML as it has not made much difference to web apps or SEO or anything for the last decade. I do like header, footer, main, section, article, aside, etc. as they make sense in the context of a document. Naming this header or section would be premature, hgroup is actually better but folks reading it may assume they need to be pedantic here. So IMHO, div would suffice.
    // no "mb-10 md:pt-20", always hoist whitespace styles to the parent.
    <hgroup className="space-y-1.5">
      <Text as="h1" intent="super">
        {title}
      </Text>
      <Text as="h2" intent="subtitle" color="dim">
        {slogan}
      </Text>
    </hgroup>
  );
}
