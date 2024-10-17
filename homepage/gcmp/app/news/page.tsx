import { H1 } from "gcmp-design-system/src/app/components/atoms/Headings";
import { P } from "gcmp-design-system/src/app/components/atoms/Paragraph";
import Link from "next/link";
import {HeroHeader} from "gcmp-design-system/src/app/components/molecules/HeroHeader";

export default function NewsPage() {
    return (
        <div className="container">
            <HeroHeader title="Blog" slogan=""/>
          <div className="prose">

            <p>Wow! You caught us a bit early.</p>
            <p>
                Follow us on <Link href="https://x.com/gcmp_io">@gcmp.io</Link>{" "}
                or <Link href="https://x.com/jazz_tools">@jazz_tools</Link>.
            </p>

            <p>
                And if you want to build something with Jazz, you should
                definitely{" "}
                <Link href="https://discord.gg/utDMjHYg42">
                    join the Jazz Discord
                </Link>
                !
            </p>
          </div>
        </div>
    );
}
