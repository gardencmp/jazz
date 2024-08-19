import { SVGProps } from "react";

export function RiArchiveDrawerLine(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M3 2.992C3 2.444 3.445 2 3.993 2h16.014a1 1 0 0 1 .993.992v18.016a.993.993 0 0 1-.993.992H3.993A1 1 0 0 1 3 21.008zM19 11V4H5v7zm0 2H5v7h14zM9 6h6v2H9zm0 9h6v2H9z"
      ></path>
    </svg>
  );
}
