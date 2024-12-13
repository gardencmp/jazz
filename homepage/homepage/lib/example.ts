export type Example = {
  name: string;
  slug: string;
  description?: string;
  illustration?: React.ReactNode;
  tech?: string[];
  features?: string[];
  demoUrl?: string;
  showDemo?: boolean;
  imageUrl?: string;
  codeSamples?: { name: string; content: React.ReactNode }[];
};

export const tech = {
  react: "React",
  nextjs: "Next.js",
  reactNative: "React Native",
  vue: "Vue",
  svelte: "Svelte",
};

export const features = {
  fileUpload: "File upload",
  imageUpload: "Image upload",
  passkey: "Passkey auth",
  clerk: "Clerk auth",
  inviteLink: "Invite link",
  coFeed: "CoFeed",
};
