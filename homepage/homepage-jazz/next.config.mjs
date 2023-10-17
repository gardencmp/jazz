import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Configure `pageExtensions`` to include MDX files
    pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
    // Optionally, add any other Next.js config below
    experimental: {
        serverActions: true,
    },
};

const withMDX = createMDX({
    // Add markdown plugins here, as desired
    options: {
        remarkPlugins: [],
        rehypePlugins: [],
    },
});

const config = {
    ...withMDX(nextConfig),
    output: 'standalone'
};

export default config;
