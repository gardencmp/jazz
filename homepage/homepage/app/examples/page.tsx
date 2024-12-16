import { ClerkFullLogo } from "@/components/icons/ClerkFullLogo";
import { NextjsLogo } from "@/components/icons/NextjsLogo";
import { ReactLogo } from "@/components/icons/ReactLogo";
import { ReactNativeLogo } from "@/components/icons/ReactNativeLogo";
import { VueLogo } from "@/components/icons/VueLogo";
import { H2 } from "gcmp-design-system/src/app/components/atoms/Headings";
import { GappedGrid } from "gcmp-design-system/src/app/components/molecules/GappedGrid";
import { HeroHeader } from "gcmp-design-system/src/app/components/molecules/HeroHeader";
import {
  CloudUploadIcon,
  FingerprintIcon,
  FolderArchiveIcon,
  Icon,
  ImageIcon,
  LockIcon,
  PencilLineIcon,
  UserPlusIcon,
} from "lucide-react";

import {
  Schema_ts as ImageUploadSchema,
  ImageUpload_tsx,
} from "@/codeSamples/examples/image-upload/src";
import {
  Schema_ts as ReactionsSchema,
  ReactionsScreen_tsx,
} from "@/codeSamples/examples/reactions/src";
import { ExampleCard } from "@/components/examples/ExampleCard";
import { ExampleDemo } from "@/components/examples/ExampleDemo";
import { SvelteLogo } from "@/components/icons/SvelteLogo";
import { Example, features, tech } from "@/lib/example";

const MockButton = ({ children }: { children: React.ReactNode }) => (
  <p className="bg-blue-100 text-blue-800 py-1 p-2 rounded-full font-medium text-center text-xs">
    {children}
  </p>
);

const ChatIllustration = () => (
  <div className="p-4 flex flex-col gap-4 justify-center h-full">
    <div className="flex flex-col gap-1 items-end">
      <p className="text-2xs">Sebastian</p>
      <p className="inline-block text-xs py-1.5 p-2 rounded-full bg-blue text-white">
        No one likes jazz. Not even you.
      </p>
    </div>

    <div className="flex flex-col gap-1 items-start">
      <p className="text-2xs">Mia</p>
      <p className="inline-block text-xs py-1.5 p-2 rounded-full bg-stone-200 text-stone-900 dark:bg-white">
        I do like jazz now, because of you.
      </p>
    </div>
  </div>
);

const ClerkIllustration = () => (
  <div className="flex items-center justify-center h-full p-8">
    <ClerkFullLogo className="w-36 h-auto" />
  </div>
);

const FormIllustration = () => (
  <div className="flex bg-stone-100 h-full flex-col items-center justify-center dark:bg-transparent">
    <div className="p-3 flex flex-col rounded-md shadow-xl shadow-stone-400/20 bg-white sm:p-5 dark:shadow-none">
      <div className="w-16 h-1 rounded-full bg-stone-400 mb-1.5" />
      <div className="w-40 h-5 rounded border mb-3 dark:border-stone-500" />
      <div className="w-16 h-1 rounded-full bg-stone-400 mb-1.5 hidden sm:block" />
      <div className="w-40 h-5 rounded border mb-3 hidden sm:block dark:border-stone-500" />

      <div className="flex items-center gap-2 mb-5">
        <div className="w-3 h-3 rounded border dark:border-stone-500" />
        <div className="w-16 h-1 rounded-full bg-stone-400" />
      </div>
      <MockButton>Submit</MockButton>
    </div>
  </div>
);

const OnboardingIllustration = () => (
  <div className="flex h-full flex-col justify-center text-sm dark:bg-transparent">
    <div className="mx-auto grid gap-3">
      {[
        { icon: UserPlusIcon, text: "Add new employee" },
        {
          icon: PencilLineIcon,
          text: "Invite employee to fill in their profile",
        },
        { icon: LockIcon, text: "Get confirmation from admin" },
      ].map(({ text, icon: Icon }, index) => (
        <div className="flex items-center gap-2">
          <span className="text-xs text-green-800 bg-green-100 leading-none font-medium text-center p-1.5 block rounded-full dark:bg-green-800 dark:text-green-200">
            <Icon strokeWidth={2} size={15} />
          </span>
          {text}
        </div>
      ))}
    </div>
  </div>
);

const MusicIllustration = () => (
  <div className="flex flex-col items-center justify-center h-full p-8">
    <div className="p-3 w-[12rem] h-[8rem] border border-dashed border-blue dark:border-blue-500 rounded-lg flex gap-2 flex-col items-center justify-center">
      <CloudUploadIcon
        size={40}
        strokeWidth={1.5}
        className="stroke-blue mx-auto dark:stroke-blue-500"
      />
      <p className="whitespace-nowrap text-stone-900 dark:text-white">
        take-five.mp3
      </p>
    </div>
  </div>
);

const ImageUploadIllustration = () => (
  <div className="flex flex-col items-center justify-center h-full p-8">
    <div className="p-3 w-[12rem] h-[8rem] border border-dashed border-blue dark:border-blue-500 rounded-lg flex gap-2 flex-col items-center justify-center">
      <ImageIcon
        size={40}
        strokeWidth={1.5}
        className="stroke-blue mx-auto dark:stroke-blue-500"
      />
      <p className="whitespace-nowrap text-stone-900 dark:text-white">
        profile-photo.jpg
      </p>
    </div>
  </div>
);

const ReactionsIllustration = () => (
  <div className="flex bg-stone-100 h-full flex-col items-center justify-center dark:bg-transparent">
    <div className="inline-flex justify-center gap-1.5 mx-auto">
      {["😍", "😮", "🤩", "😂", "👍"].map((emoji) => (
        <button
          type="button"
          key={emoji}
          className="size-10 text-xl rounded shadow-sm bg-white leading-none"
        >
          {emoji}
        </button>
      ))}
    </div>
  </div>
);

const BookShelfIllustration = () => (
  <div className="h-full max-w-[30rem] mx-auto flex flex-col justify-center p-6 md:p-5">
    <div className="flex justify-between items-baseline">
      <p className="font-display font-medium tracking-tight  text-sm text-stone-900 dark:text-white">
        Your book shelf
      </p>

      <MockButton>Add book</MockButton>
    </div>

    <div className="grid grid-cols-3 gap-4 mt-3">
      {["malibu.jpg", "pathless.jpg", "upgrade.jpg"].map((book) => (
        <img
          key={book}
          src={`/book-covers/${book}`}
          alt=""
          className="w-full h-full object-cover rounded-r-md shadow-sm border dark:border-none"
        />
      ))}
    </div>
  </div>
);

const PetIllustration = () => (
  <div className="h-full p-4 bg-[url('/dog.jpg')] bg-cover bg-center p-4 flex items-end">
    <div className="inline-flex justify-center gap-1 mx-auto">
      {["😍", "😮", "🤩", "😂", "👍"].map((emoji) => (
        <button
          type="button"
          key={emoji}
          className="size-6 rounded shadow-sm bg-white leading-none"
        >
          {emoji}
        </button>
      ))}
    </div>
  </div>
);

const PasswordManagerIllustration = () => (
  <div className="max-w-[30rem] mx-auto flex flex-col justify-center h-full p-5 gap-4">
    <div className="flex justify-between items-center">
      <p className="font-display font-medium tracking-tight text-sm text-stone-900 dark:text-white">
        Password manager
      </p>

      <button
        type="button"
        className="border py-1 p-2 rounded-full font-medium text-xs"
      >
        Log out
      </button>
    </div>

    <table className="text-xs">
      <thead>
        <tr className="w-full text-stone-700 bg-stone-50 border-b dark:bg-transparent dark:text-stone-400">
          <th className="font-medium tracking-wider text-left uppercase p-2">
            Username
          </th>
          <th className="font-medium tracking-wider text-left uppercase p-2">
            URI
          </th>
          <th className="font-medium tracking-wider text-left uppercase p-2">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b">
          <td className="p-2">user@gmail.com</td>
          <td className="p-2">gmail.com</td>
          <td className="p-2">
            <MockButton>Copy password</MockButton>
          </td>
        </tr>
        <tr className="border-b">
          <td className="p-2">user@gmail.com</td>
          <td className="p-2">fb.com</td>
          <td className="p-2">
            <MockButton>Copy password</MockButton>
          </td>
        </tr>
        <tr className="border-b">
          <td className="p-2">user@gmail.com</td>
          <td className="p-2">x.com</td>
          <td className="p-2">
            <MockButton>Copy password</MockButton>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);

const FileShareIllustration = () => (
  <div className="flex flex-col items-center justify-center h-full gap-3 p-8">
    <p>This file was shared with you.</p>
    <div className="p-3 w-full border rounded-lg flex justify-between gap-5">
      <div className="flex items-center gap-2">
        <FolderArchiveIcon
          size={24}
          strokeWidth={1.5}
          className="stroke-blue dark:stroke-blue-500"
        />
        <p className="whitespace-nowrap text-stone-900 dark:text-white">
          top-secret.zip
        </p>
      </div>

      <MockButton>Download</MockButton>
    </div>
  </div>
);

const PasskeyIllustration = () => (
  <div className="flex bg-stone-100 h-full flex-col items-center justify-center dark:bg-transparent">
    <div className="p-4 flex flex-col items-center gap-3 rounded-md shadow-xl shadow-stone-400/20 bg-white dark:shadow-none">
      <FingerprintIcon
        size={36}
        strokeWidth={0.75}
        className="stroke-red-600"
      />
      <p className="text-xs dark:text-stone-900">Continue with Touch ID</p>
    </div>
  </div>
);

const reactExamples: Example[] = [
  {
    name: "Chat",
    slug: "chat",
    description: "A simple app that creates a chat room with a shareable link.",
    tech: [tech.react],
    demoUrl: "https://chat.jazz.tools",
    illustration: <ChatIllustration />,
  },
  {
    name: "Rate my pet",
    slug: "pets",
    description:
      "Upload a photo of your pet, and invite your friends to react to it.",
    tech: [tech.react],
    features: [features.imageUpload, features.inviteLink],
    demoUrl: "https://pets-demo.jazz.tools",
    illustration: <PetIllustration />,
  },
  {
    name: "Todo list",
    slug: "todo",
    description: "A todo list where you can collaborate with invited guests.",
    tech: [tech.react],
    features: [features.inviteLink],
    demoUrl: "https://todo-demo.jazz.tools",
    illustration: (
      <div className="h-full w-full bg-cover bg-[url('/todo.jpg')] bg-left-bottom"></div>
    ),
  },
  {
    name: "Password manager",
    slug: "password-manager",
    description: "A secure password manager, using Passkey for authentication.",
    tech: [tech.react],
    features: [features.passkey],
    demoUrl: "https://passwords-demo.jazz.tools",
    illustration: <PasswordManagerIllustration />,
  },
  {
    name: "Music player",
    slug: "music-player",
    description:
      "Upload your favorite songs, and share them with your friends.",
    tech: [tech.react],
    features: [features.fileUpload],
    demoUrl: "https://music-demo.jazz.tools",
    illustration: <MusicIllustration />,
  },
  {
    name: "Clerk",
    slug: "clerk",
    description: "A React app that uses Clerk for authentication",
    tech: [tech.react],
    features: [features.clerk],
    demoUrl: "https://clerk-demo.jazz.tools",
    illustration: <ClerkIllustration />,
  },
  {
    name: "Passkey",
    slug: "passkey",
    description: "A React app that uses Passkey for authentication",
    tech: [tech.react],
    features: [features.passkey],
    demoUrl: "https://passkey-demo.jazz.tools",
    illustration: <PasskeyIllustration />,
  },
  {
    name: "Form",
    slug: "form",
    description: "A form example for creating and editing CoValues",
    tech: [tech.react],
    demoUrl: "https://form-demo.jazz.tools",
    illustration: <FormIllustration />,
  },
  {
    name: "HR Onboarding",
    slug: "onboarding",
    description:
      "See how admin and writer permissions work while onboarding new employees",
    tech: [tech.react],
    features: [features.imageUpload, features.inviteLink],
    illustration: <OnboardingIllustration />,
  },
];

const nextExamples: Example[] = [
  {
    name: "Book shelf",
    slug: "book-shelf",
    description:
      "Track and rate the books you read, readable by everyone with the link.",
    tech: [tech.nextjs],
    features: [features.imageUpload],
    demoUrl: "https://books-demo.jazz.tools",
    imageUrl: "/books.jpg",
    illustration: <BookShelfIllustration />,
  },
];

const rnExamples: Example[] = [
  {
    name: "Chat",
    slug: "chat-rn",
    description: "A simple app that creates a chat room with a shareable link.",
    tech: [tech.reactNative],
    illustration: <ChatIllustration />,
  },

  {
    name: "Chat",
    slug: "chat-rn-clerk",
    description: "Exactly like the React Native chat app, with Clerk for auth.",
    tech: [tech.reactNative],
    features: [features.clerk],
    illustration: <ClerkIllustration />,
  },
];

const vueExamples: Example[] = [
  {
    name: "Chat",
    slug: "chat-vue",
    description: "A simple app that creates a chat room with a shareable link.",
    tech: [tech.vue],
    illustration: <ChatIllustration />,
  },
  {
    name: "Todo list",
    slug: "todo-vue",
    description: "A todo list where you can collaborate with invited guests.",
    tech: [tech.vue],
    features: [features.inviteLink],
    demoUrl: "https://todo-demo.jazz.tools",
    illustration: (
      <div className="h-full w-full bg-cover bg-[url('/todo.jpg')] bg-left-bottom"></div>
    ),
  },
];

const demos = [
  {
    name: "Image upload",
    slug: "image-upload",
    description: "Learn how to upload and delete images",
    tech: [tech.react],
    features: [features.imageUpload],
    demoUrl: "https://image-upload-demo.jazz.tools",
    illustration: <ImageUploadIllustration />,
    showDemo: true,
    codeSamples: [
      {
        name: "image-upload.tsx",
        content: <ImageUpload_tsx />,
      },
      {
        name: "schema.ts",
        content: <ImageUploadSchema />,
      },
    ],
  },
  {
    name: "Reactions",
    slug: "reactions",
    description: "Collect and render reactions from multiple users.",
    tech: [tech.react],
    features: [features.coFeed],
    demoUrl: "https://reactions-demo.jazz.tools",
    illustration: <ReactionsIllustration />,
    showDemo: true,
    codeSamples: [
      {
        name: "reactions.tsx",
        content: <ReactionsScreen_tsx />,
      },
      {
        name: "schema.ts",
        content: <ReactionsSchema />,
      },
    ],
  },
];

const svelteExamples: Example[] = [
  {
    name: "Passkey",
    slug: "passkey-svelte",
    description: "A Svelte app that uses Passkey for authentication",
    tech: [tech.svelte],
    features: [features.passkey],
    illustration: <PasskeyIllustration />,
  },
  {
    name: "File share",
    slug: "file-share-svelte",
    description: "Upload a file, then share the link for others to download.",
    tech: [tech.svelte],
    features: [features.fileUpload, features.passkey, features.inviteLink],
    illustration: <FileShareIllustration />,
  },
];

const categories = [
  {
    name: "React",
    id: "react",
    logo: ReactLogo,
    examples: reactExamples,
  },
  {
    name: "Next.js",
    id: "next",
    logo: NextjsLogo,
    examples: nextExamples,
  },
  {
    name: "React Native",
    id: "react-native",
    logo: ReactNativeLogo,
    examples: rnExamples,
  },
  {
    name: "Vue",
    id: "vue",
    logo: VueLogo,
    examples: vueExamples,
  },
  {
    name: "Svelte",
    id: "svelte",
    logo: SvelteLogo,
    examples: svelteExamples,
  },
];

export default function Page() {
  return (
    <div className="container flex flex-col gap-6 pb-10 lg:pb-20">
      <HeroHeader
        title="Example apps"
        slogan="Find an example app with code most similar to what you want to build"
      />

      <div className="grid gap-8 mb-12 lg:gap-12">
        <h2 className="sr-only">Example apps with demo and code</h2>
        {demos.map(
          (demo) =>
            demo.showDemo && <ExampleDemo key={demo.slug} example={demo} />,
        )}
      </div>

      <div className="grid gap-12 lg:gap-20">
        {categories.map((category) => (
          <div key={category.name}>
            <div className="flex items-center gap-3 mb-5">
              <category.logo className="h-8 w-8" />
              <H2 id={category.id} className="!mb-0">
                {category.name}
              </H2>
            </div>

            <GappedGrid>
              {category.examples.map((example) =>
                example.showDemo ? (
                  <ExampleDemo key={example.slug} example={example} />
                ) : (
                  <ExampleCard
                    className="border bg-stone-50 shadow-sm p-3 rounded-lg dark:bg-stone-950"
                    key={example.slug}
                    example={example}
                  />
                ),
              )}
            </GappedGrid>
          </div>
        ))}
      </div>
    </div>
  );
}
