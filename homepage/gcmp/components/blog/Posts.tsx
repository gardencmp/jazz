import { posts } from "@/lib/posts";
import { FormattedDate } from "@/components/FormattedDate";
import PostCoverImage from "@/components/blog/PostCoverImage";
import Link from "next/link";

export function Posts() {
    return (
        <div className="grid grid-cols-3 gap-8">
            {posts.map((post) => (
                <div className="flex flex-col gap-2" key={post.slug}>
                    <PostCoverImage
                        post={post}
                        linkToPost
                        className="mb-1.5 rounded-lg"
                    />
                    <Link
                        href={`/news/${post.slug}`}
                        className="text-lg font-medium text-display text-stone-900 dark:text-white"
                    >
                        {post.title}
                    </Link>
                    <p className="line-clamp-3 leading-relaxed text-ellipsis text-sm text-stone-900 dark:text-stone-400">
                        {post.excerpt}
                    </p>
                    <div className="flex text-sm items-center">
                        {post.author.name} • <FormattedDate date={post.date} />
                    </div>
                </div>
            ))}
        </div>
    );
}
