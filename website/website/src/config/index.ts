// IMPORTANT: isProduction will be true for all vercel deployments regardless of environment.
const isProduction = process.env.NODE_ENV === "production";

const generalConfig = {
  LAST_UPDATED: "2024-07-22",
  PUBLIC_DOMAIN: "jazz.tools",
  PUBLIC_URL: "https://www.jazz.tools",
  EMAIL: "hello@gcmp.io",
  GITHUB_URL: "https://github.com/callumflack",
  CALENDLY_URL: "https://calendly.com/callumflack/30min",
  TWITTER_URL: "https://twitter.com/callumflack",
  LINKEDIN_URL: "https://www.linkedin.com/in/callumflack/",
  SUBSTACK_URL: "https://thelittoralline.substack.com/",
  READCV_URL: "https://read.cv/callum",
};

export default {
  ...generalConfig,
  isProduction,
};
