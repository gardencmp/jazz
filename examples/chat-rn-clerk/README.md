<p align="center">
  <a href="https://clerk.com?utm_source=github&utm_medium=clerk_docs" target="_blank" rel="noopener noreferrer">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="./assets/images/light-logo.png">
      <img alt="Clerk Logo for light background" src="./assets/images/dark-logo.png" height="64">
    </picture>
  </a>
  <br />
</p>
<div align="center">
  <h1>
    Clerk and Expo Quickstart 
  </h1>  
  <a href="https://www.npmjs.com/package/@clerk/clerk-js">
    <img alt="Downloads" src="https://img.shields.io/npm/dm/@clerk/clerk-js" />
  </a>
  <a href="https://discord.com/invite/b5rXHjAg7A">
    <img alt="Discord" src="https://img.shields.io/discord/856971667393609759?color=7389D8&label&logo=discord&logoColor=ffffff" />
  </a>
  <a href="https://twitter.com/clerkdev">
    <img alt="Twitter" src="https://img.shields.io/twitter/url.svg?label=%40clerkdev&style=social&url=https%3A%2F%2Ftwitter.com%2Fclerkdev" />
  </a> 
  <br />
  <br />
  <img alt="Clerk Hero Image" src="./assets/images/hero.png">
</div>

## Introduction

Clerk is a developer-first authentication and user management solution. It provides pre-built React components and hooks for sign-in, sign-up, user profile, and organization management. Clerk is designed to be easy to use and customize, and can be dropped into any React or Next.js application.

After following the quickstart you'll have learned how to:

- Install `@clerk/clerk-expo`
- Setup your environment key
- Wrap your Expo app in `<ClerkProvider />` and supply your `tokenCache`
- Conditionally show content based on your auth state
- Build your sign-in and sign-up pages

## Running the template

```bash
git clone https://github.com/clerk/clerk-expo-quickstart
```

To run the example locally, you'll need to make sure you have XCode installed and configured properly, then:

1. Sign up for a Clerk account at [https://clerk.com](https://dashboard.clerk.com/sign-up?utm_source=DevRel&utm_medium=docs&utm_campaign=templates&utm_content=10-24-2023&utm_term=clerk-expo-quickstart).

2. Go to the [Clerk dashboard](https://dashboard.clerk.com?utm_source=DevRel&utm_medium=docs&utm_campaign=templates&utm_content=10-24-2023&utm_term=clerk-expo-quickstart) and create an application.

3. Set the required Clerk environment variable as shown in [the example `env` file](./.env.example).

4. `npm install` the required dependencies.

5. `npm run start` to launch the development server.

## Learn more

To learn more about Clerk and Expo, check out the following resources:

- [Quickstart: Get started with Expo and Clerk](https://clerk.com/docs/quickstarts/expo?utm_source=DevRel&utm_medium=docs&utm_campaign=templates&utm_content=10-24-2023&utm_term=clerk-expo-quickstart)

- [Clerk Documentation](https://clerk.com/docs/references/expo/overview?utm_source=DevRel&utm_medium=docs&utm_campaign=templates&utm_content=10-24-2023&utm_term=clerk-expo-quickstart)

- [Expo Documentation](https://docs.expo.dev/)

## Found an issue or want to leave feedback

Feel free to create a support thread on our [Discord](https://clerk.com/discord). Our support team will be happy to assist you in the `#support` channel.

## Connect with us

You can discuss ideas, ask questions, and meet others from the community in our [Discord](https://discord.com/invite/b5rXHjAg7A).

If you prefer, you can also find support through our [Twitter](https://twitter.com/ClerkDev), or you can [email](mailto:support@clerk.dev) us!
