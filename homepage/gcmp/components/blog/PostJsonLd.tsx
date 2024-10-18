import { Post } from "@/interfaces/blogPost";

export function PostJsonLd({ post }: { post: Post }) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        image: post.coverImage,
        author: {
            "@type": "Person",
            name: post.author.name,
        },
        publisher: {
            "@type": "Organization",
            name: "Garden Computing",
        },
        datePublished: post.date,
        description: post.excerpt,
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
