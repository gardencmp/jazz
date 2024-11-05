import { Button } from "gcmp-design-system/src/app/components/atoms/Button";
import { GappedGrid } from "gcmp-design-system/src/app/components/molecules/GappedGrid";
import { SiGithub } from "@icons-pack/react-simple-icons";

type Example = {
    name: string;
    slug: string;
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

const reactExamples = [
    {
        name: "Chat",
        slug: "chat",
        tech: [tech.react],
        demoUrl: "https://chat.jazz.tools",
    },
    {
        name: "Chat",
        slug: "chat-clerk",
        tech: [tech.react],
        features: [features.clerk],
        demoUrl: "https://chat-clerk-demo.jazz.tools",
    },
    {
        name: "Music player",
        slug: "music-player",
        tech: [tech.react],
        features: [features.fileUpload],
        demoUrl: "https://music-demo.jazz.tools",
    },
    {
        name: "Pets",
        slug: "pets",
        tech: [tech.react],
        features: [features.fileUpload, features.inviteLink],
        demoUrl: "https://example-pets.jazz.tools",
    },
    {
        name: "Todo",
        slug: "todo",
        tech: [tech.react],
        features: [features.inviteLink],
        demoUrl: "https://example-todo.jazz.tools",
    },
    {
        name: "Password manager",
        slug: "password-manager",
        tech: [tech.react],
        features: [features.passkey],
        demoUrl: "https://passwords-demo.jazz.tools",
    },
];

const nextExamples = [
    {
        name: "Book shelf",
        slug: "book-shelf",
        tech: [tech.nextjs],
        features: [features.fileUpload],
        demoUrl: "https://books-demo.jazz.tools",
    },
];

const rnExamples: Example[] = [
    {
        name: "Chat",
        slug: "chat-rn",
        tech: [tech.reactNative],
    },

    {
        name: "Chat",
        slug: "chat-rn-clerk",
        tech: [tech.reactNative],
        features: [features.clerk],
    },
];
const categories = [
    {
        name: "React",
        examples: reactExamples,
    },
    {
        name: "Next.js",
        examples: nextExamples,
    },
    {
        name: "React Native",
        examples: rnExamples,
    },
];

function Example({ example }: { example: Example }) {
    const { name, slug, tech, features, demoUrl } = example;
    const githubUrl = `https://github.com/gardencmp/jazz/tree/main/examples/${slug}`;

    return (
        <div className="border rounded-xl p-4 shadow-sm col-span-2 flex flex-col gap-3">
            <div className="flex-1 space-y-2">
                <h2 className="font-medium text-stone-900 dark:text-white">
                    {name}
                </h2>
                <div className="flex gap-1">
                    {tech?.map((tech) => (
                        <p
                            className="bg-green-50 border border-green-500 text-green-600 rounded-full py-0.5 px-2 text-xs"
                            key={tech}
                        >
                            {tech}
                        </p>
                    ))}
                    {features?.map((feature) => (
                        <p
                            className="bg-pink-50 border border-pink-500 text-pink-600 rounded-full py-0.5 px-2 text-xs"
                            key={feature}
                        >
                            {feature}
                        </p>
                    ))}
                </div>
            </div>

            <div className="flex gap-2">
                <Button href={githubUrl} variant="secondary" size="sm">
                    View on GitHub
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

export default function Page() {
    return (
        <>
            <h1>Example Apps</h1>
            {/*{categories.map(category => (*/}
            {/*  <div>*/}
            {/*      <h2>{category.name}</h2>*/}
            {/*  </div>*/}
            {/*))}*/}
            <GappedGrid className="not-prose">
                {[...reactExamples, ...nextExamples, ...rnExamples].map(
                    (example) => (
                        <Example key={example.slug} example={example} />
                    ),
                )}
            </GappedGrid>
        </>
    );
}
