import { Posts } from "@/components/blog/Posts";
import { HeroHeader } from "gcmp-design-system/src/app/components/molecules/HeroHeader";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import { NewsletterForm } from "gcmp-design-system/src/app/components/organisms/NewsletterForm";
import Link from "next/link";

export const metadata = {
  title: "Blog",
};

export default function NewsPage() {
  return (
    <div className="container flex flex-col gap-10">
      <HeroHeader title="Blog" slogan="" />

      <Posts />

      <Prose>
        <p>Stay up to date with our latest news.</p>

        <NewsletterForm />

        <p>
          Follow us on{" "}
          <Link href="https://x.com/gardendotco">@gardendotco</Link> or{" "}
          <Link href="https://x.com/jazz_tools">@jazz_tools</Link>.
        </p>

        <p>
          And if you want to build something with Jazz, you should definitely{" "}
          <Link href="https://discord.gg/utDMjHYg42">
            join the Jazz Discord
          </Link>
          !
        </p>
      </Prose>
    </div>
  );
}
