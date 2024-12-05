# Contribution Guide

Thank you for considering contributing to Jazz! Jazz is an open-source framework for building local-first apps. We value your time and effort and are excited to collaborate with you. This guide will help you get started with contributing.

## How to Contribute

### 1. Reporting Bugs

If you find a bug, please [open an issue with as much detail as possible](https://github.com/garden-co/jazz/issues). Include:

- A clear and descriptive title.
- Steps to reproduce the issue.
- What you expected to happen.
- What actually happened.

### 2. Suggesting Enhancements

We welcome all ideas! If you have suggestions, feel free to open an issue marked with the "enhancement" label. Please provide context on why the enhancement would be beneficial and how it could be implemented.

### 3. Pull Requests

1. **Fork the repository** and create your feature branch (see [GitHub's guide on forking a repository](https://docs.github.com/en/get-started/quickstart/fork-a-repo) if you're unfamiliar with the process):

2. **Make your changes**, ensuring that you follow our coding standards (`pnpm format` (prettier) and `pnpm lint` (eslint) will automatically let you know there are issues).

3. **Commit your changes** with a descriptive commit message.

4. **Push to your fork** and submit a pull request.

5. **Describe your pull request**, explaining the problem it solves or the enhancement it adds.

### 4. Code Style Guidelines

- We use [Prettier](https://prettier.io/) for formatting. Please ensure your code is formatted before submitting.
- Write descriptive comments where necessary.

### 5. Local Setup

You'll need Node.js 20.x or 22.x installed (we're working on support for 23.x), and pnpm 9.x installed. If you're using nix, run `nix develop` to get a shell with the correct versions of everything installed.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/garden-co/jazz.git
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Run tests** to verify everything is working:
   ```bash
   pnpm test
   ```

### 6. Testing

Please write tests for any new features or bug fixes. We use Vitest for unit tests, and Playwright for e2e tests. Make sure all tests pass before submitting a pull request.

```bash
pnpm test
```

NB: You'll need to run `pnpm exec playwright install` to install the Playwright browsers before first run.

### 7. Communication

- If you're unsure about anything, feel free to ask questions by opening a discussion, reaching out via issues, or on our [Discord](https://discord.gg/utDMjHYg42).
- Be respectful and constructive, this is a welcoming community for everyone.
- Please be mindful of GitHub’s [Community Guidelines](https://docs.github.com/en/site-policy/github-terms/github-community-guidelines), which include being kind, avoiding disruptive behavior, and respecting others.

## Code of Conduct

Please read and adhere to our [Code of Conduct](./CODE_OF_CONDUCT.md) to ensure a positive experience for all contributors.

---

Thank you again for your interest in contributing to Jazz. Your help makes this project better for everyone!

If you have any questions, don't hesitate to reach out. Let's make something great together!

