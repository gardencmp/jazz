import { TOCItem } from "../lib/extractMDXSourceAndTOC";

export const TOC = ({ toc }: { toc: TOCItem[] }) => (
    <nav>
        <ul>
            {toc.map((heading, index) => (
                <li
                    key={index}
                    style={{ marginLeft: `${heading.depth - 1}em` }}
                >
                    {heading.text}
                </li>
            ))}
        </ul>
    </nav>
);
