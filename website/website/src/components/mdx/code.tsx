import { ReactNode } from "react";
import { highlight } from "sugar-high";

interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  children: ReactNode | string;
  language?: string;
}

// export const Code = ({ children, ...props }) => {
//   let codeHTML = highlight(children);
//   return <code dangerouslySetInnerHTML={{ __html: codeHTML }} {...props} />;
// };

export const Code = ({
  children,
  language = "typescript",
  ...props
}: CodeProps) => {
  const codeContent = typeof children === "string" ? children : "";
  let codeHTML = highlight(codeContent);
  return (
    <code
      className={`language-${language}`}
      dangerouslySetInnerHTML={{ __html: codeHTML }}
      {...props}
    />
  );
};
