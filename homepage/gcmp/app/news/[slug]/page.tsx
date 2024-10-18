import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import { PostHeader } from "@/components/blog/PostHeader";

export default async function Post({ params }: Params) {
    const post = getPostBySlug(params.slug);

    if (!post) {
        return notFound();
    }

    return (
        <main>
            <div className="container">
                <article className="mb-32">
                    <PostHeader
                        title={post.title}
                        coverImage={post.coverImage}
                        date={post.date}
                        author={post.author}
                    />
                    <Prose>{post.content}</Prose>
                </article>
            </div>
        </main>
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
