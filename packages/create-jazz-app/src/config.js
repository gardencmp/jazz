// browser-nextjs-demo-auth (bookshelf example)
// mobile-react-native-expo-clerk-auth (chat-rn-clerk example)
// Export the typed configMap
export const configMap = {
  browser: {
    browser: {
      react: { auth: ["demo", "passkey", "passphrase", "clerk"] },
      vue: { auth: ["demo"] },
      svelte: { auth: ["passkey"] },
      nextjs: { auth: ["demo", "passkey", "passphrase", "clerk"] },
    },
  },
  mobile: {
    mobile: {
      "react-native-expo": { auth: ["demo", "clerk"] },
    },
  },
  server: {
    nodejs: {
      nodejs: { auth: ["keypair"] },
    },
    deno: {
      deno: { auth: ["keypair"] },
    },
    bun: {
      bun: { auth: ["keypair"] },
    },
  },
};
export const frameworkToAuthExamples = {
  "react-demo-auth": {
    name: "React + Jazz + Demo Auth",
    repo: "garden-co/jazz/examples/chat",
  },
  "react-passkey-auth": {
    name: "React + Jazz + Passkey Auth",
    repo: "garden-co/jazz/examples/passkey",
  },
  "react-clerk-auth": {
    name: "React + Jazz + Clerk Auth",
    repo: "garden-co/jazz/examples/clerk",
  },
  "vue-demo-auth": {
    name: "Vue + Jazz + Demo Auth",
    repo: "garden-co/jazz/examples/todo-vue",
  },
  "svelte-passkey-auth": {
    name: "Svelte + Jazz + Passkey Auth",
    repo: "garden-co/jazz/examples/passkey-svelte",
  },
  "nextjs-demo-auth": {
    name: "Next.js + Jazz + Demo Auth",
    repo: "garden-co/jazz/examples/book-shelf",
  },
  "react-native-expo-clerk-auth": {
    name: "React Native Expo + Jazz + Clerk Auth",
    repo: "garden-co/jazz/examples/chat-rn-clerk",
  },
  "react-passphrase-auth": {
    name: "[To Be Implemented] React + Jazz + Passphrase Auth",
    repo: undefined,
  },
  "nextjs-passkey-auth": {
    name: "[To Be Implemented] Next.js + Jazz + Passkey Auth",
    repo: undefined,
  },
  "nextjs-passphrase-auth": {
    name: "[To Be Implemented] Next.js + Jazz + Passphrase Auth",
    repo: undefined,
  },
  "nextjs-clerk-auth": {
    name: "[To Be Implemented] Next.js + Jazz + Clerk Auth",
    repo: undefined,
  },
  "react-native-expo-demo-auth": {
    name: "[To Be Implemented] React Native Expo + Jazz + Demo Auth",
    repo: undefined,
  },
  "nodejs-keypair-auth": {
    name: "[To Be Implemented] Node.js + Jazz + Keypair Auth",
    repo: undefined,
  },
  "deno-keypair-auth": {
    name: "[To Be Implemented] Deno + Jazz + Keypair Auth",
    repo: undefined,
  },
  "bun-keypair-auth": {
    name: "[To Be Implemented] Bun + Jazz + Keypair Auth",
    repo: undefined,
  },
};
