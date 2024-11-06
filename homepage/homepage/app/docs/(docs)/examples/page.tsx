import { Button } from "gcmp-design-system/src/app/components/atoms/Button";
import { GappedGrid } from "gcmp-design-system/src/app/components/molecules/GappedGrid";
import { ReactLogo } from "@/components/icons/ReactLogo";
import { ReactNativeLogo } from "@/components/icons/ReactNativeLogo";
import { NextjsLogo } from "@/components/icons/NextjsLogo";
import { CloudUploadIcon, FingerprintIcon, KeyRoundIcon } from "lucide-react";
import { ClerkFullLogo } from "@/components/icons/ClerkFullLogo";

type Example = {
    name: string;
    slug: string;
    description?: string;
    illustration?: React.ReactNode;
    tech?: string[];
    features?: string[];
    demoUrl?: string;
};

const tech = {
    react: "React",
    nextjs: "Next.js",
    reactNative: "React Native",
};

const features = {
    fileUpload: "File upload",
    passkey: "Passkey auth",
    clerk: "Clerk auth",
    inviteLink: "Invite link",
};

const ChatIllustration = () => (
    <div className="p-4 flex flex-col gap-4 justify-center h-full">
        <div className="flex flex-col gap-1 items-end">
            <p className="text-2xs">Sebastian</p>
            <p className="inline-block text-xs py-1.5 px-3 rounded-full bg-blue text-white">
                No one likes jazz. Not even you.
            </p>
        </div>

        <div className="flex flex-col gap-1 items-start">
            <p className="text-2xs">Mia</p>
            <p className="inline-block text-xs py-1.5 px-3 rounded-full bg-stone-200 text-stone-900 dark:bg-white">
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
        <div className="py-3 px-4 border border-dashed border-blue dark:border-blue-500 rounded-lg flex gap-2 flex-col items-center">
            <CloudUploadIcon
                size={30}
                strokeWidth={1.5}
                className="stroke-blue mx-auto dark:stroke-blue-500"
            />
            <p className="whitespace-nowrap text-xs text-stone-900 dark:text-white">
                tortured-poets-department.mp3
            </p>
        </div>
    </div>
);

const BookShelfIllustration = () => (
    <div className="h-full p-5">
        <div className="flex justify-between items-baseline">
            <p className="font-display font-medium tracking-tight  text-sm text-stone-900 dark:text-white">
                Your book shelf
            </p>

            <p className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full font-medium text-xs">
                Add book
            </p>
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
                    className="size-6 rounded shadow-sm bg-white leading-none hover:bg-stone-100"
                >
                    {emoji}
                </button>
            ))}
        </div>
    </div>
);

const reactExamples = [
    {
        name: "Chat",
        slug: "chat",
        description:
            "A simple app that creates a chat room with a shareable link.",
        tech: [tech.react],
        demoUrl: "https://chat.jazz.tools",
        illustration: <ChatIllustration />,
    },
    {
        name: "Chat",
        slug: "chat-clerk",
        description:
            "Exactly like the chat app, but it uses Clerk for authentication.",
        tech: [tech.react],
        features: [features.clerk],
        demoUrl: "https://chat-clerk-demo.jazz.tools",
        illustration: <ClerkIllustration />,
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
        name: "Rate my pet",
        slug: "pets",
        description:
            "Upload a photo of your pet, and invite your friends to react to it.",
        tech: [tech.react],
        features: [features.fileUpload, features.inviteLink],
        demoUrl: "https://example-pets.jazz.tools",
        illustration: <PetIllustration />,
    },
    {
        name: "Todo list",
        slug: "todo",
        description:
            "A todo list where you can collaborate with invited guests.",
        tech: [tech.react],
        features: [features.inviteLink],
        demoUrl: "https://example-todo.jazz.tools",
        illustration: (
            <div className="relative h-full">
                <img
                    src="/todo.jpg"
                    className="object-cover"
                    alt="Todo list illustration"
                />
            </div>
        ),
    },
    {
        name: "Password manager",
        slug: "password-manager",
        description:
            "A secure password manager, using Passkey for authentication.",
        tech: [tech.react],
        features: [features.passkey],
        demoUrl: "https://passwords-demo.jazz.tools",
        illustration: (
            <div className="flex bg-stone-100 h-full flex-col items-center justify-center dark:bg-transparent">
                <div className="p-4 flex flex-col items-center gap-3 rounded-md shadow-xl shadow-stone-400/20 bg-white dark:shadow-none">
                    <FingerprintIcon
                        size={36}
                        strokeWidth={0.75}
                        className="stroke-red-600"
                    />
                    <p className="text-xs dark:text-stone-900">
                        Continue with Touch ID
                    </p>
                </div>
            </div>
        ),
    },
];

const nextExamples = [
    {
        name: "Book shelf",
        slug: "book-shelf",
        description:
            "Track and rate the books you read, readable by everyone with the link.",
        tech: [tech.nextjs],
        features: [features.fileUpload],
        demoUrl: "https://books-demo.jazz.tools",
        imageUrl: "/books.jpg",
        illustration: <BookShelfIllustration />,
    },
];

const rnExamples: Example[] = [
    {
        name: "Chat",
        slug: "chat-rn",
        description: "A simple chat app using React Native.",
        tech: [tech.reactNative],
        illustration: <ChatIllustration />,
    },

    {
        name: "Chat",
        slug: "chat-rn-clerk",
        description:
            "Exactly like the React Native chat app, with Clerk for auth.",
        tech: [tech.reactNative],
        features: [features.clerk],
        illustration: <ClerkIllustration />,
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
];

function Example({ example }: { example: Example }) {
    const {
        name,
        slug,
        tech,
        features,
        description,
        demoUrl,
        illustration,
    } = example;
    const githubUrl = `https://github.com/gardencmp/jazz/tree/main/examples/${slug}`;

    return (
        <div className="border bg-stone-50 shadow-sm p-3 flex flex-col gap-3 rounded-lg md:gap-4 dark:bg-stone-950">
            <div className="aspect-[16/9] overflow-hidden w-full rounded-md bg-white border dark:bg-stone-925 sm:aspect-[2/1] md:aspect-[3/2]">
                {illustration}
            </div>

            <div className="flex-1 space-y-2">
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
        </div>
    );
}

export default function Page() {
    return (
        <>
            <h1>Example Apps</h1>
            {categories.map((category) => (
                <div className="my-12" key={category.name}>
                    <div className="flex items-center gap-3 mb-5">
                        <category.logo className="h-8 w-8" />
                        <h2 className="my-0">{category.name}</h2>
                    </div>

                    <div className="not-prose grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
                        {category.examples.map((example) => (
                            <Example key={example.slug} example={example} />
                        ))}
                    </div>
                </div>
            ))}
        </>
    );
}
