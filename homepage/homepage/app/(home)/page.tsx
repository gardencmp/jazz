import { CodeExampleTabs, ResponsiveIframe } from "@/components/forMdx";
import {
    Prose,
    SmallProse,
} from "gcmp-design-system/src/app/components/molecules/Prose";
import { SectionHeader } from "gcmp-design-system/src/app/components/molecules/SectionHeader";
import { GappedGrid } from "gcmp-design-system/src/app/components/molecules/GappedGrid";
import { LabelledFeatureIcon } from "gcmp-design-system/src/app/components/molecules/LabelledFeatureIcon";
import { GridCard } from "gcmp-design-system/src/app/components/atoms/GridCard";
import { CodeRef } from "gcmp-design-system/src/app/components/atoms/CodeRef";
import { ComingSoonBadge } from "gcmp-design-system/src/app/components/atoms/ComingSoonBadge";

import {
    UploadCloudIcon,
    MonitorSmartphoneIcon,
    GaugeIcon,
    UsersIcon,
    FileLock2Icon,
    HardDriveDownloadIcon,
    KeyRoundIcon,
    MousePointerSquareDashedIcon,
} from "lucide-react";

import {
    Main_tsx,
    Schema_ts,
    App_tsx,
    ChatScreen_tsx,
    Ui_tsx,
} from "@/codeSamples/examples/chat/src";

import CoValuesIntro from "./coValuesIntro.mdx";
import CoMapDescription from "./coValueDescriptions/coMapDescription.mdx";
import CoListDescription from "./coValueDescriptions/coListDescription.mdx";
import CoPlainTextDescription from "./coValueDescriptions/coPlainTextDescription.mdx";
import CoStreamDescription from "./coValueDescriptions/coStreamDescription.mdx";
import BinaryCoStreamDescription from "./coValueDescriptions/binaryCoStreamDescription.mdx";
import ImageDefinitionDescription from "./coValueDescriptions/imageDefinitionDescription.mdx";
import GroupDescription from "./coValueDescriptions/groupDescription.mdx";
import AccountDescription from "./coValueDescriptions/accountDescription.mdx";
import AutoSubDescription from "./toolkit/autoSub.mdx";
import CursorsAndCaretsDescription from "./toolkit/cursorsAndCarets.mdx";
import AuthProvidersDescription from "./toolkit/authProviders.mdx";
import TwoWaySyncDescription from "./toolkit/twoWaySync.mdx";
import FileUploadDownloadDescription from "./toolkit/fileUploadDownload.mdx";
import VideoPresenceCallsDescription from "./toolkit/videoPresenceCalls.mdx";
import MeshIntro from "./meshIntro.mdx";
import { H3 } from "gcmp-design-system/src/app/components/atoms/Headings";
import Link from "next/link";
import { DiagramBeforeJazz } from "@/components/DiagramBeforeJazz";
import { DiagramAfterJazz } from "@/components/DiagramAfterJazz";
import { Button } from "@/components/Button";
import { SupportedEnvironments } from "@/components/home/SupportedEnvironments";
import { HairlineBleedGrid } from "gcmp-design-system/src/app/components/molecules/HairlineGrid";
import { Hero } from "@/components/home/Hero";

const ArrowDoodle = ({ className }: { className?: string }) => (
    <svg
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        width="107"
        height="85"
        viewBox="0 0 107 85"
        fill="none"
    >
        <path
            d="M3.87338 33.7809C32.7867 45.4747 65.5543 47.9975 91.7667 37.4141"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
        />
        <path
            d="M74.1719 24.958C83.1201 33.0289 92.3253 37.1887 98.5899 34.6593"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
        />
        <path
            d="M87.2448 58.8003C88.3842 46.6564 92.3253 37.1887 98.5899 34.6593"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
        />
    </svg>
);

export default function Home() {
    const features = [
        {
            title: "Local-first",
            icon: HardDriveDownloadIcon,
            description: (
                <>
                    <p>
                        All data you load or create is persisted locally, so
                        your users can work offline.
                    </p>
                    <p>
                        When you’re back online, your local changes are synced
                        to the server.
                    </p>
                </>
            ),
        },
        {
            title: "Multiplayer",
            icon: MousePointerSquareDashedIcon,
            description: (
                <>
                    <p>
                        Share state with other users and get automatic real-time
                        multiplayer.
                    </p>
                    <p>
                        Use the same primitives to quickly build user presence
                        UI, like cursors.
                    </p>
                </>
            ),
        },
        {
            title: "File uploads",
            icon: UploadCloudIcon,
            description: (
                <>
                    <p>
                        Create & handle structured data and binary streams/blobs
                        the same way.
                    </p>
                    <p>
                        <Link className="underline" href="/mesh">
                            Jazz Mesh
                        </Link>{" "}
                        or your own server become both cloud database and blob
                        storage.
                    </p>
                </>
            ),
        },
        {
            title: "Social features",
            icon: UsersIcon,
            description: (
                <>
                    <p>
                        Groups of accounts are first class entities that you can
                        create anywhere.
                    </p>
                    <p>
                        Building multi-user apps becomes as easy as building the
                        UI for them.
                    </p>
                </>
            ),
        },
        {
            title: "Permissions",
            icon: FileLock2Icon,
            description: (
                <>
                    <p>
                        Control access to data with role-based permissions,
                        easily defined locally.
                    </p>
                    <p>
                        Reference data across permission scopes for granular
                        access control.
                    </p>
                </>
            ),
        },
        {
            title: "Sync",
            icon: MonitorSmartphoneIcon,
            description: (
                <>
                    <p>
                        Build your app around mutable local state attached to an
                        account.
                    </p>
                    <p>
                        Every device with the same account will always have
                        everything in sync.
                    </p>
                </>
            ),
        },
        {
            title: "E2EE",
            icon: KeyRoundIcon,
            description: (
                <>
                    <p>
                        All data is end-to-end encrypted and cryptographically
                        signed by default.
                    </p>
                    <p>
                        So it can’t be tampered with and Jazz Mesh only sees
                        encrypted data.
                    </p>
                </>
            ),
        },
        {
            title: "Instant updates",
            icon: GaugeIcon,
            description: (
                <>
                    <p>
                        Get instant updates throughout your UI every time you
                        locally mutate data.
                    </p>
                    <p>
                        Remote changes are synced and applied with minimal
                        latency.
                    </p>
                </>
            ),
        },
    ];

    return (
        <>
            <Hero features={features} />

            <div className="bg-stone-100 border-y dark:bg-stone-925 py-8 lg:py-16 dark:border-stone-900">
                <div className="container grid gap-8 lg:gap-12">
                    <h2 className="font-display md:text-center text-stone-950 dark:text-white text-2xl md:text-3xl font-semibold tracking-tight">
                        Hard things are easy now.
                    </h2>
                    <div className="grid gap-8 md:grid-cols-11 lg:gap-5">
                        <div className="md:col-span-5 flex flex-col justify-between">
                            <div className="text-pretty leading-relaxed text-lg max-w-2xl space-y-2 md:text-xl md:space-y-4 md:leading-relaxed">
                                <p>
                                    Ever notice how every stack just{" "}
                                    <span className="font-semibold text-stone-900 dark:text-white">
                                        reinvents shared state between users and
                                        machines
                                    </span>
                                    ?
                                </p>
                                <p>
                                    And far from the simple client-server model,
                                    you routinely tackle{" "}
                                    <span className="font-semibold text-stone-900 dark:text-white">
                                        a mess of moving parts
                                    </span>
                                    , tech choices and deployment questions.
                                </p>
                                <p>
                                    And{" "}
                                    <span className="font-semibold text-stone-900 dark:text-white">
                                        your app’s code is all over the place.
                                    </span>
                                </p>
                            </div>
                            <div className="w-full mt-8 lg:mt-12">
                                <div className="p-4 sm:p-8 rounded-xl bg-white shadow-sm dark:bg-stone-900">
                                    <DiagramBeforeJazz className="w-full h-auto max-w-[30rem] mx-auto dark:text-white"></DiagramBeforeJazz>
                                </div>
                            </div>
                        </div>

                        <div className="hidden md:block relative pr-3 top-24">
                            <ArrowDoodle className="w-full h-auto text-stone-300 dark:text-stone-800" />
                        </div>

                        <div className="md:col-span-5 flex flex-col justify-between">
                            <div className="text-pretty leading-relaxed text-lg max-w-2xl space-y-2 md:text-xl md:space-y-4 md:leading-relaxed">
                                <p>
                                    Jazz provides a single new abstraction to do
                                    the whole job.
                                </p>
                                <p>
                                    It turns the data flow around and gives you{" "}
                                    <span className="font-semibold text-stone-900 dark:text-white">
                                        mutable local state
                                    </span>
                                    , solving{" "}
                                    <span className="font-semibold text-stone-900 dark:text-white">
                                        sync
                                    </span>
                                    ,{" "}
                                    <span className="font-semibold text-stone-900 dark:text-white">
                                        concurrent editing
                                    </span>{" "}
                                    and{" "}
                                    <span className="font-semibold text-stone-900 dark:text-white">
                                        permissions
                                    </span>{" "}
                                    under the hood.
                                </p>
                                <p>
                                    <span className="font-semibold text-stone-900 dark:text-white">
                                        All that’s left?
                                    </span>{" "}
                                    What makes your app your app.
                                </p>
                            </div>
                            <div className="w-full mt-8 lg:mt-12">
                                <div className="p-4 sm:p-8 rounded-xl bg-white shadow-sm dark:bg-stone-900">
                                    <DiagramAfterJazz className="w-full h-auto max-w-[30rem] mx-auto dark:text-white"></DiagramAfterJazz>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container flex flex-col gap-8 py-8 lg:gap-20 lg:py-20">
                <div className="flex flex-col gap-4 md:gap-6">
                    <SectionHeader
                        title="Everything you need to ship top-tier apps quickly."
                        slogan="Features that used to take months to build now work out-of-the-box."
                    />

                    <HairlineBleedGrid>
                        {features.map(({ title, icon: Icon, description }) => (
                            <LabelledFeatureIcon
                                key={title}
                                label={title}
                                icon={Icon}
                                explanation={description}
                            />
                        ))}
                    </HairlineBleedGrid>
                </div>

                <div>
                    <SectionHeader
                        title="First impressions..."
                        slogan="A chat app in 174 lines of code."
                    />

                    <div className="flex flex-col md:grid md:grid-cols-2 md:divide-x border rounded-sm overflow-hidden shadow-sm dark:border-stone-900 dark:divide-stone-900">
                        <CodeExampleTabs
                            tabs={[
                                {
                                    name: "main.tsx",
                                    content: <Main_tsx />,
                                },
                                {
                                    name: "app.tsx",
                                    content: <App_tsx />,
                                },
                                {
                                    name: "schema.ts",
                                    content: <Schema_ts />,
                                },
                                {
                                    name: "chatScreen.tsx",
                                    content: <ChatScreen_tsx />,
                                },
                                {
                                    name: "ui.tsx",
                                    content: <Ui_tsx />,
                                },
                            ]}
                        />
                        <div className="border-b order-first md:order-last flex flex-col md:border-b-0">
                            <div className="flex border-b overflow-x-auto overflow-y-hidden bg-white dark:border-stone-900 dark:bg-stone-900">
                                <p className="items-center -mb-px transition-colors px-3 pb-1.5 pt-2 block text-xs border-b-2 border-blue-700 text-stone-700 dark:bg-stone-925 dark:text-blue-500 dark:border-blue-500">
                                    result
                                </p>
                            </div>
                            <ResponsiveIframe
                                src="https://chat.jazz.tools"
                                localSrc="http://localhost:5173"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <SectionHeader
                        title="Jazz Mesh"
                        slogan="Serverless sync & storage for Jazz apps"
                    />

                    <Prose>
                        <MeshIntro />
                    </Prose>

                    <div className="mt-8">
                        <Button href="/mesh" variant="secondary">
                            Learn more about Jazz Mesh {"->"}
                        </Button>
                    </div>
                </div>

                <div>
                    <SectionHeader
                        title="Collaborative Values"
                        slogan="Your new building blocks."
                    />

                    <Prose>
                        <CoValuesIntro />
                    </Prose>
                </div>

                <GappedGrid
                    title="Bread-and-butter datastructures"
                    className="grid-cols-2 lg:grid-cols-4"
                >
                    <GridCard>
                        <H3>
                            <CodeRef>CoMap</CodeRef>
                        </H3>
                        <SmallProse>
                            <CoMapDescription />
                        </SmallProse>
                    </GridCard>

                    <GridCard>
                        <H3>
                            <CodeRef>CoList</CodeRef>
                        </H3>
                        <SmallProse>
                            <CoListDescription />
                        </SmallProse>
                    </GridCard>

                    <GridCard>
                        <H3>
                            <CodeRef>CoPlainText</CodeRef> &{" "}
                            <CodeRef>CoRichText</CodeRef> <ComingSoonBadge />
                        </H3>
                        <SmallProse>
                            <CoPlainTextDescription />
                        </SmallProse>
                    </GridCard>

                    <GridCard>
                        <H3>
                            <CodeRef>CoStream</CodeRef>
                        </H3>
                        <SmallProse>
                            <CoStreamDescription />
                        </SmallProse>
                    </GridCard>
                </GappedGrid>

                <GappedGrid
                    title="First-class files & binary data"
                    className="grid-cols-2 lg:grid-cols-4"
                >
                    <GridCard>
                        <H3>
                            <CodeRef>BinaryCoStream</CodeRef>
                        </H3>
                        <SmallProse>
                            <BinaryCoStreamDescription />
                        </SmallProse>
                    </GridCard>

                    <GridCard>
                        <H3>
                            <CodeRef>ImageDefinition</CodeRef>
                        </H3>
                        <SmallProse>
                            <ImageDefinitionDescription />
                        </SmallProse>
                    </GridCard>
                </GappedGrid>

                <GappedGrid
                    title="Secure permissions, authorship & teams"
                    className="grid-cols-2 lg:grid-cols-4"
                >
                    <GridCard>
                        <H3>
                            <CodeRef>Group</CodeRef>
                        </H3>
                        <SmallProse>
                            <GroupDescription />
                        </SmallProse>
                    </GridCard>
                    <GridCard>
                        <H3>
                            <CodeRef>Account</CodeRef>
                        </H3>
                        <SmallProse>
                            <AccountDescription />
                        </SmallProse>
                    </GridCard>
                </GappedGrid>

                <SupportedEnvironments />

                <GappedGrid>
                    <GridCard>
                        <SectionHeader
                            title="Auto-sub"
                            slogan="Let your UI drive data-syncing."
                        />
                        <SmallProse>
                            <AutoSubDescription />
                        </SmallProse>
                    </GridCard>

                    <GridCard>
                        <SectionHeader
                            title="Cursors & carets"
                            slogan="Ready-made spatial presence."
                        />
                        <SmallProse>
                            <CursorsAndCaretsDescription />
                        </SmallProse>
                    </GridCard>

                    <GridCard>
                        <SectionHeader
                            title="Auth Providers"
                            slogan="Plug and play different kinds of auth."
                        />
                        <SmallProse>
                            <AuthProvidersDescription />
                        </SmallProse>
                    </GridCard>

                    <GridCard>
                        <SectionHeader
                            title="Two-way sync to your DB"
                            slogan="Add Jazz to an existing app."
                        />
                        <SmallProse>
                            <TwoWaySyncDescription />
                        </SmallProse>
                    </GridCard>

                    <GridCard>
                        <SectionHeader
                            title="File upload & download"
                            slogan={
                                <>
                                    Just use{" "}
                                    <CodeRef>{`<input type='file'/>`}</CodeRef>.
                                </>
                            }
                        />
                        <SmallProse>
                            <FileUploadDownloadDescription />
                        </SmallProse>
                    </GridCard>

                    <GridCard>
                        <SectionHeader
                            title="Video presence & calls"
                            slogan="Stream and record audio & video."
                        />
                        <SmallProse>
                            <VideoPresenceCallsDescription />
                        </SmallProse>
                    </GridCard>
                </GappedGrid>

                <div className="border border-stone-200 dark:border-stone-900 rounded-xl shadow-sm p-4 md:py-16">
                    <div className="flex flex-col lg:max-w-3xl md:text-center mx-auto justify-between gap-6">
                        <p className="uppercase text-blue tracking-wide text-sm font-medium dark:text-stone-400">
                            Become an early adopter
                        </p>
                        <h3 className="font-display md:text-center text-stone-950 dark:text-white text-2xl md:text-3xl font-semibold tracking-tight">
                            We&apos;ll help you build your next app with Jazz
                        </h3>
                        <div className="space-y-2 md:text-balance leading-relaxed">
                            <p>
                                It&apos;s early days, but we work hard every day
                                to make Jazz a great tool for our users.
                            </p>
                            <p>
                                We want to hear about what you&apos;re building,
                                so we can help you every step of the way.
                                We&apos;ll prioritize features that you need to
                                succeed.
                            </p>
                        </div>
                        <div className="flex md:justify-center gap-3">
                            <Button
                                href="https://discord.gg/utDMjHYg42"
                                variant="primary"
                            >
                                Let&apos;s talk on Discord
                            </Button>
                            <Button href="/docs" variant="secondary">
                                Read <span className="sm:hidden">docs</span>{" "}
                                <span className="hidden sm:inline">
                                    documentation
                                </span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
