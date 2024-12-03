export enum Framework {
  React = "react",
  ReactNative = "react-native",
  Vue = "vue",
  Svelte = "svelte",
}

export const frameworks = Object.values(Framework);

export const frameworkNames: Record<Framework, string> = {
  [Framework.React]: "React",
  [Framework.ReactNative]: "React Native",
  [Framework.Vue]: "Vue",
  [Framework.Svelte]: "Svelte",
};

export const DEFAULT_FRAMEWORK = Framework.React;

export function isValidFramework(value: string): value is Framework {
  return frameworks.includes(value as Framework);
}
