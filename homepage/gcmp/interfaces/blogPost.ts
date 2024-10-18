import { type Author } from "./author";

export type Post = {
    slug: string;
    title: string;
    date: Date;
    coverImage: string;
    author: Author;
    excerpt: string;
    content: React.ReactNode;
};
