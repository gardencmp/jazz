export function PostJsonLd({
    title,
    image,
    author,
    datePublished,
    description,
}: {
    title: string;
    image: string;
    author: string;
    datePublished: string;
    description: string;
}) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        image,
        author: {
            "@type": "Person",
            name: author,
        },
        publisher: {
            "@type": "Organization",
            name: "Garden Computing",
        },
        datePublished,
        description,
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
