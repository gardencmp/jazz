import { Post } from "@/interfaces/blogPost";
import { Author } from "@/interfaces/author";
import Test from "@/components/blog/posts/test.mdx";

const authors = {
    anselm: {
        name: "Anselm Eickhoff",
        picture: "/social-image.png",
    },
};

export const posts: Array<Post> = [
    {
        title: "Introducing Jazz",
        author: authors.anselm,
        slug: "test",
        coverImage: "/social-image.png",
        date: new Date(),
        excerpt:
            "Jazz is a framework for local-first data/permissions. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut gravida vel urna sit amet lacinia. Morbi euismod mi ac lacus feugiat, vel sollicitudin urna faucibus. ",
        content: <Test />,
    },
    {
        title: "Introducing Jazz",
        author: authors.anselm,
        slug: "test",
        coverImage: "/social-image.png",
        date: new Date(),
        excerpt:
            "Jazz is a framework for local-first data/permissions. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut gravida vel urna sit amet lacinia. Morbi euismod mi ac lacus feugiat, vel sollicitudin urna faucibus. ",
        content: <Test />,
    },
    {
        title: "Introducing Jazz",
        author: authors.anselm,
        slug: "test",
        coverImage: "/social-image.png",
        date: new Date(),
        excerpt:
            "Jazz is a framework for local-first data/permissions. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut gravida vel urna sit amet lacinia. Morbi euismod mi ac lacus feugiat, vel sollicitudin urna faucibus. ",
        content: <Test />,
    },
];

export const getPostBySlug = (slug: string) => {
    return posts.find((post) => post.slug === slug);
};
