# Create Jazz App

🎷 A modern CLI tool to scaffold Jazz applications with your favorite framework and authentication method.

## Features

- 🚀 Quick start with popular frameworks (React, Vue, Svelte, Next.js, React Native)
- 🔐 Multiple authentication options (Demo, Passkey, Clerk, etc.)
- 📦 Support for various package managers (npm, yarn, pnpm, bun, deno)
- 💅 Beautiful CLI interface with interactive prompts
- ⚡️ Zero-config setup process

## Usage

You can create a new Jazz app in two ways:

### Interactive Mode

Simply run:

```bash
npm create jazz-app@latest
```

or

```bash
npx create-jazz-app@latest
```

Then follow the interactive prompts to select your:
- Framework and authentication combination
- Package manager
- Project name

### Command Line Mode

Or specify all options directly:

```bash
npm create jazz-app@latest -- --starter react-demo-auth --project-name my-app --package-manager npm
```

## Available Starters

Currently implemented starters:

- `react-demo-auth` - React + Jazz + Demo Auth
- `react-passkey-auth` - React + Jazz + Passkey Auth
- `react-clerk-auth` - React + Jazz + Clerk Auth
- `vue-demo-auth` - Vue + Jazz + Demo Auth
- `svelte-passkey-auth` - Svelte + Jazz + Passkey Auth
- `nextjs-demo-auth` - Next.js + Jazz + Demo Auth
- `react-native-expo-clerk-auth` - React Native Expo + Jazz + Clerk Auth

More starters coming soon! Check the help menu (`create-jazz-app --help`) for the latest list.

## System Requirements

- Node.js 14.0.0 or later
- Package manager of your choice (npm, yarn, pnpm, bun, or deno)

## What Happens When You Run It?

1. 🎭 Prompts for your preferences (or uses command line arguments)
2. 📥 Clones the appropriate starter template
3. 📦 Updates dependencies to their latest versions
4. ⚙️ Installs all required packages
5. 🎉 Sets up your project and provides next steps

## License

MIT

---

Made with ♥️ by the Jazz team
