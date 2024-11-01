import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostBySlug, posts } from "@/lib/posts";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import { H1 } from "gcmp-design-system/src/app/components/atoms/Headings";
import PostCoverImage from "@/components/blog/PostCoverImage";
import Image from "next/image";
import { FormattedDate } from "@/components/FormattedDate";
import { PostJsonLd } from "@/components/blog/PostJsonLd";

export default async function Post({ params }: Params) {
    const post = getPostBySlug(params.slug);

    if (!post) {
        return notFound();
    }

    const { title, coverImage, date, author, excerpt } = post.meta;
    const content = post.default({});

    return (
        <>
            <PostJsonLd
                title={title}
                image={coverImage}
                author={author.name}
                datePublished={date}
                description={excerpt}
            />
            <article className="container max-w-3xl flex flex-col gap-8 py-8 lg:py-16 lg:gap-12">
                <div className="flex flex-col gap-2">
                    <H1>{title}</H1>

                    <div className="flex items-center gap-3">
                        <Image
                            width={100}
                            height={100}
                            src={author.image}
                            className="size-12 rounded-full"
                            alt=""
                        />
                        <div>
                            <p className="text-stone-900 dark:text-white">
                                {author.name}
                            </p>
                            <p className="text-sm text-stone-600 dark:text-stone-400">
                                <FormattedDate date={date} />
                            </p>
                        </div>
                    </div>
                </div>

                <PostCoverImage src={coverImage} title={title} />

                <Prose>{content}</Prose>
            </article>
        </>
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

    const { title, excerpt, coverImage } = post.meta;

    return {
        title,
        description: excerpt,
        openGraph: {
            title,
            images: [coverImage],
        },
    };
}

export async function generateStaticParams() {
    return posts.map((post) => ({
        slug: post.meta.slug,
    }));
}
