declare module "*.mdx" {
    export const meta: {
        slug: string;
        title: string;
        date: string;
        coverImage: string;
        author: {
            name: string;
            image: string;
        };
        excerpt: string;
    };
}
