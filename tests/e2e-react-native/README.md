# 🎷 Jazz + Expo + `react-navigation` + Demo Auth

## 🚀 How to Run

### 1. Inside the Workspace Root

First, install dependencies and build the project:

```bash
pnpm i
pnpm run build
```

### 2. Inside the `tests/e2e-react-native` Directory

Next, navigate to the specific example project and run the following commands:

```bash
pnpm expo prebuild
npx pod-install
pnpm expo run:ios
```

This will set up and launch the app on iOS. For Android, you can replace the last command with `pnpm expo run:android`.

## 🧪 Testing

To test that the crypto is compatible with the Node.js crypto, click on "Create CoMap" and then paste the command from the clipboard into the terminal having `tests/e2e-react-native` as the current directory.

This will create a new CoMap and then validate that the text is "Updated from React Native" and then update the text to "Updated from Node.js".

You can check back in the app to see that the text is "Updated from Node.js".
