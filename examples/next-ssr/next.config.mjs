/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['jazz-tools', 'jazz-nodejs', 'cojson-storage-indexeddb'],
    webpack: (config) => {
        config.resolve.extensionAlias = {
            ".js": [".ts", ".tsx", ".js"],
        };

        return config;
    },
};

export default nextConfig;
