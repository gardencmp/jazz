import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import { PostHeader } from "@/components/blog/PostHeader";
import Avatar from "@/components/Avatar";
import { H1 } from "gcmp-design-system/src/app/components/atoms/Headings";
import DateFormatter from "@/components/DateFormatter";
import PostCoverImage from "@/components/blog/PostCoverImage";
import { formatDate } from "@/lib/date";
import Image from "next/image";

export default async function Post({ params }: Params) {
    const post = getPostBySlug(params.slug);

    if (!post) {
        return notFound();
    }

    const { title, coverImage, date, author } = post;
    const formattedDate = formatDate(date);

    return (
        <article className="container max-w-3xl flex flex-col gap-8 py-8 lg:py-16 lg:gap-12">
            <div className="flex flex-col gap-2">
                <H1>{title}</H1>

                <div className="flex items-center gap-3">
                    <Image
                        width={100}
                        height={100}
                        src={author.picture}
                        className="size-12 rounded-full"
                        alt={author.name}
                    />
                    <div>
                        <p className="text-stone-900 dark:text-white">
                            {author.name}
                        </p>
                        <p className="text-sm text-stone-600 dark:text-stone-400">
                            {formattedDate}
                        </p>
                    </div>
                </div>
            </div>

            <PostCoverImage title={title} src={coverImage} />

            <Prose>{post.content}</Prose>
        </article>
    );
}

type Params = {
    params: {
        slug: string;
    };
};

export function generateMetadata({ params }: Params): Metadata {
    const post = getPostBySlug(params.slug);

    if (!post) {
        return notFound();
    }

    const title = `${post.title}`;

    return {
        title,
        openGraph: {
            title,
            images: [post.coverImage],
        },
    };
}

export async function generateStaticParams() {
    const posts = getAllPosts();

    return posts.map((post) => ({
        slug: post.slug,
    }));
}
