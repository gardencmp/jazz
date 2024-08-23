import { CustomMDX } from "@/components/mdx";
import { Link } from "@/components/ui/link";
import { MdxData } from "@/lib/mdx-types";
import { formatDate } from "@/lib/format-date";
import { Suspense } from "react";
import { CalendarIcon, GitHubLogoIcon } from "@radix-ui/react-icons";

interface DocContentProps {
  post: MdxData;
}

export function DocContent({ post }: DocContentProps) {
  return (
    <section className="PageContainer container lg:px-[48px] max-w-[720px] space-y-w8">
      <header className="space-y-1.5">
        <h1 className="Text-title text-fill-contrast">{post.metadata.title}</h1>
        <div className="flex items-center gap-2.5 text-small text-solid">
          <Link
            href={post.metadata.link ?? "#"}
            target="_blank"
            className="flex items-center gap-1.5"
          >
            <GitHubLogoIcon className="size-em" />
            Code
          </Link>
          <hr className="hr-vertical h-[13px]" />
          <Suspense fallback={<p className="h-5" />}>
            <p className="flex items-center gap-1.5">
              <CalendarIcon className="size-em" />
              {formatDate(post.metadata.publishedAt)}
            </p>
          </Suspense>
        </div>
      </header>
      <article className="prose">
        <CustomMDX source={post.content} />
      </article>
    </section>
  );
}
