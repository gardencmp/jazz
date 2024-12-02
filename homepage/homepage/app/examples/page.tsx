import { ClerkFullLogo } from "@/components/icons/ClerkFullLogo";
import { NextjsLogo } from "@/components/icons/NextjsLogo";
import { ReactLogo } from "@/components/icons/ReactLogo";
import { ReactNativeLogo } from "@/components/icons/ReactNativeLogo";
import { VueLogo } from "@/components/icons/VueLogo";
import { clsx } from "clsx";
import { Button } from "gcmp-design-system/src/app/components/atoms/Button";
import { H2 } from "gcmp-design-system/src/app/components/atoms/Headings";
import { GappedGrid } from "gcmp-design-system/src/app/components/molecules/GappedGrid";
import { HeroHeader } from "gcmp-design-system/src/app/components/molecules/HeroHeader";
import { CloudUploadIcon, FingerprintIcon, ImageIcon } from "lucide-react";

import {
  Schema_ts as ImageUploadSchema,
  ImageUpload_tsx,
} from "@/codeSamples/examples/image-upload/src";
import {
  Schema_ts as ReactionsSchema,
  ReactionsScreen_tsx,
} from "@/codeSamples/examples/reactions/src";

type Example = {
  name: string;
  slug: string;
  description?: string;
  illustration?: React.ReactNode;
  tech?: string[];
  features?: string[];
  demoUrl?: string;
  showDemo?: boolean;
  imageUrl?: string;
  codeSamples?: { name: string; source: string }[];
};

const tech = {
  react: "React",
  nextjs: "Next.js",
  reactNative: "React Native",
  vue: "Vue",
};

const features = {
  fileUpload: "File upload",
  imageUpload: "Image upload",
  passkey: "Passkey auth",
  clerk: "Clerk auth",
  inviteLink: "Invite link",
  coFeed: "CoFeed",
};

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
        source: ImageUpload_tsx,
      },
      {
        name: "schema.ts",
        source: ImageUploadSchema,
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
        source: ReactionsScreen_tsx,
      },
      {
        name: "schema.ts",
        source: ReactionsSchema,
      },
    ],
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
    illustration: (
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

const categories = [
  {
    name: "React",
    logo: ReactLogo,
    examples: reactExamples,
  },
  {
    name: "Next.js",
    logo: NextjsLogo,
    examples: nextExamples,
  },
  {
    name: "React Native",
    logo: ReactNativeLogo,
    examples: rnExamples,
  },
  {
    name: "Vue",
    logo: VueLogo,
    examples: vueExamples,
  },
];

function Example({
  example,
  className,
}: { example: Example; className?: string }) {
  const { name, slug, tech, features, description, demoUrl, illustration } =
    example;
  const githubUrl = `https://github.com/gardencmp/jazz/tree/main/examples/${slug}`;

  return (
    <div className={clsx(className, "col-span-2 flex flex-col")}>
      {illustration && (
        <div className="mb-3 aspect-[16/9] overflow-hidden w-full rounded-md bg-white border dark:bg-stone-925 sm:aspect-[2/1] md:aspect-[3/2]">
          {illustration}
        </div>
      )}

      <div className="flex-1 space-y-2 mb-2">
        <h2 className="font-medium text-stone-900 dark:text-white leading-none">
          {name}
        </h2>
        <div className="flex gap-1">
          {tech?.map((tech) => (
            <p
              className="bg-green-50 border border-green-500 text-green-600 rounded-full py-0.5 px-2 text-xs dark:bg-green-800 dark:text-green-200 dark:border-green-700"
              key={tech}
            >
              {tech}
            </p>
          ))}
          {features?.map((feature) => (
            <p
              className="bg-pink-50 border border-pink-500 text-pink-600 rounded-full py-0.5 px-2 text-xs dark:bg-pink-800 dark:text-pink-200 dark:border-pink-700"
              key={feature}
            >
              {feature}
            </p>
          ))}
        </div>
        <p className="text-sm">{description}</p>
      </div>
      <div className="flex gap-2">
        <Button href={githubUrl} variant="secondary" size="sm">
          View code
        </Button>
        {demoUrl && (
          <Button href={demoUrl} variant="secondary" size="sm">
            View demo
          </Button>
        )}
      </div>
    </div>
  );
}

function ExampleDemo({ example }: { example: Example }) {
  const { name, slug, tech, features, description, demoUrl, illustration } =
    example;
  const githubUrl = `https://github.com/gardencmp/jazz/tree/main/examples/${slug}`;

  return (
    <GappedGrid
      gap="none"
      className="col-span-full my-12 border bg-stone-50 shadow-sm rounded-lg dark:bg-stone-950 overflow-hidden"
    >
      <div className="p-3 col-span-full border-b">
        <Example example={{ ...example, illustration: null }} />
      </div>
      <div className="h-[30rem] overflow-auto col-span-3">
        {example.codeSamples?.map(({ source: Source }) => (
          <div className="text-base">
            <Source />
          </div>
        ))}
      </div>
      <div className="h-[30rem] col-span-3">
        <iframe width="100%" height="100%" src={demoUrl} title={name} />
      </div>
    </GappedGrid>
  );

  return (
    <div className="col-span-full">
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex gap-3 items-center">
          <h2 className="font-medium text-stone-900 dark:text-white leading-none">
            {name}
          </h2>
          <div className="flex gap-1">
            {tech?.map((tech) => (
              <p
                className="bg-green-50 border border-green-500 text-green-600 rounded-full py-0.5 px-2 text-xs dark:bg-green-800 dark:text-green-200 dark:border-green-700"
                key={tech}
              >
                {tech}
              </p>
            ))}
            {features?.map((feature) => (
              <p
                className="bg-pink-50 border border-pink-500 text-pink-600 rounded-full py-0.5 px-2 text-xs dark:bg-pink-800 dark:text-pink-200 dark:border-pink-700"
                key={feature}
              >
                {feature}
              </p>
            ))}
          </div>
        </div>
        <div className="space-x-2">
          <Button href={githubUrl} variant="secondary" size="sm">
            View code
          </Button>
          {demoUrl && (
            <Button href={demoUrl} variant="secondary" size="sm">
              View demo
            </Button>
          )}
        </div>
      </div>
      <GappedGrid className="col-span-full border divide-x shadow-sm rounded-lg dark:bg-stone-950">
        <div className="col-span-3"></div>
        <div className="h-[40rem] bg-stone-50 p-16 flex items-center justify-center col-span-3">
          <iframe
            width="100%"
            height="100%"
            src={demoUrl}
            title={name}
            className="rounded-xl shadow-lg"
          />
        </div>
      </GappedGrid>
    </div>
  );
}

export default function Page() {
  return (
    <div className="container flex flex-col gap-6 pb-10 lg:pb-20">
      <HeroHeader
        title="Example apps"
        slogan="Find an example app with code most similar to what you want to build"
      />

      <div className="grid gap-12 lg:gap-20">
        {categories.map((category) => (
          <div key={category.name}>
            <div className="flex items-center gap-3 mb-5">
              <category.logo className="h-8 w-8" />
              <H2 className="!mb-0">{category.name}</H2>
            </div>

            <GappedGrid>
              {category.examples.map((example) =>
                example.showDemo ? (
                  <ExampleDemo key={example.slug} example={example} />
                ) : (
                  <Example
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
