// IMPORTANT: isProduction will be true for all vercel deployments regardless of environment.
const isProduction = process.env.NODE_ENV === "production";

const generalConfig = {
  LAST_UPDATED: "2024-07-22",
  PUBLIC_DOMAIN: "jazz.tools",
  PUBLIC_URL: "https://www.jazz.tools",
  EMAIL: "hello@gcmp.io",
  GITHUB_URL: "https://github.com/gardencmp/jazz",
  TWITTER_URL: "https://twitter.com/anselm_io",
  DEFAULT_TITLE: "jazz - Instant sync",
  DEFAULT_DESCRIPTION:
    "Go beyond request/response - ship modern apps with sync.",
};

const config = {
  ...generalConfig,
  isProduction,
};

export default config;
