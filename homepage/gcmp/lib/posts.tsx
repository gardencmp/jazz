import * as TestPost from "@/components/blog/posts/test.mdx";

export const posts: (typeof TestPost)[] = [];

export const getPostBySlug = (slug: string) => {
    return posts.find((post) => post.meta.slug === slug);
};
