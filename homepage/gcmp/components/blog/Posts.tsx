import { FormattedDate } from "@/components/FormattedDate";
import PostCoverImage from "@/components/blog/PostCoverImage";
import { posts } from "@/lib/posts";
import Link from "next/link";

export function Posts() {
  return (
    <div className="grid grid-cols-3 gap-8">
      {posts.map((post) => (
        <div className="flex flex-col gap-2" key={post.meta.slug}>
          <PostCoverImage
            src={post.meta.coverImage}
            title={post.meta.title}
            slug={post.meta.slug}
            className="mb-1.5 rounded-lg"
          />
          <Link
            href={`/news/${post.meta.slug}`}
            className="text-stone-900 dark:text-white"
          >
            <h1 className="text-2xl font-display font-semibold tracking-tight">
              {post.meta.title}
            </h1>
            <h2 className="text-base text-stone-600 dark:text-stone-400">
              {post.meta.subtitle}
            </h2>
          </Link>
          <p className="line-clamp-3 leading-relaxed text-ellipsis text-sm text-stone-900 dark:text-stone-400">
            {post.meta.excerpt}
          </p>
          <div className="flex text-sm items-center">
            {post.meta.author.name} • <FormattedDate date={post.meta.date} />
          </div>
        </div>
      ))}
    </div>
  );
}
