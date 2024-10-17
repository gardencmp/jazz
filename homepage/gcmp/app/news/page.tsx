import Link from "next/link";
import { HeroHeader } from "gcmp-design-system/src/app/components/molecules/HeroHeader";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import { NewsletterForm } from "@/components/NewsletterForm";

export const metadata = {
    title: "Blog",
};

export default function NewsPage() {
    return (
        <div className="container">
            <HeroHeader title="Blog" slogan="" />
            <Prose>
                <p>Wow! You caught us a bit early.</p>

                <p>You can subscribe to our newsletter below.</p>

                <NewsletterForm />

                <p>
                    Follow us on{" "}
                    <Link href="https://x.com/gcmp_io">@gcmp.io</Link> or{" "}
                    <Link href="https://x.com/jazz_tools">@jazz_tools</Link>.
                </p>

                <p>
                    And if you want to build something with Jazz, you should
                    definitely{" "}
                    <Link href="https://discord.gg/utDMjHYg42">
                        join the Jazz Discord
                    </Link>
                    !
                </p>
            </Prose>
        </div>
    );
}
