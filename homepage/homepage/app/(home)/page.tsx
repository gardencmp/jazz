import { CodeExampleTabs, ResponsiveIframe } from "@/components/forMdx";
import {
    Prose,
    SmallProse,
} from "gcmp-design-system/src/app/components/molecules/Prose";
import { HeroHeader } from "gcmp-design-system/src/app/components/molecules/HeroHeader";
import { SectionHeader } from "gcmp-design-system/src/app/components/molecules/SectionHeader";
import { HairlineBleedGrid } from "gcmp-design-system/src/app/components/molecules/HairlineGrid";
import { GappedGrid } from "gcmp-design-system/src/app/components/molecules/GappedGrid";
import { LabelledFeatureIcon } from "gcmp-design-system/src/app/components/molecules/LabelledFeatureIcon";
import { GridCard } from "gcmp-design-system/src/app/components/atoms/GridCard";
import { CodeRef } from "gcmp-design-system/src/app/components/atoms/CodeRef";
import { ComingSoonBadge } from "gcmp-design-system/src/app/components/atoms/ComingSoonBadge";
import { UL } from "gcmp-design-system/src/app/components/molecules/List";
import { LI } from "gcmp-design-system/src/app/components/atoms/ListItem";
import { P } from "gcmp-design-system/src/app/components/atoms/Paragraph";
import { TextLink } from "gcmp-design-system/src/app/components/atoms/TextLink";

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

import Intro from "./intro.mdx";
import CoValuesIntro from "./coValuesIntro.mdx";
import CoMapDescription from "./coValueDescriptions/coMapDescription.mdx";
import CoListDescription from "./coValueDescriptions/coListDescription.mdx";
import CoPlainTextDescription from "./coValueDescriptions/coPlainTextDescription.mdx";
import CoStreamDescription from "./coValueDescriptions/coStreamDescription.mdx";
import BinaryCoStreamDescription from "./coValueDescriptions/binaryCoStreamDescription.mdx";
import ImageDefinitionDescription from "./coValueDescriptions/imageDefinitionDescription.mdx";
import GroupDescription from "./coValueDescriptions/groupDescription.mdx";
import AccountDescription from "./coValueDescriptions/accountDescription.mdx";
import SupportedEnvironments from "./supportedEnvironments.mdx";
import AutoSubDescription from "./toolkit/autoSub.mdx";
import CursorsAndCaretsDescription from "./toolkit/cursorsAndCarets.mdx";
import AuthProvidersDescription from "./toolkit/authProviders.mdx";
import TwoWaySyncDescription from "./toolkit/twoWaySync.mdx";
import FileUploadDownloadDescription from "./toolkit/fileUploadDownload.mdx";
import VideoPresenceCallsDescription from "./toolkit/videoPresenceCalls.mdx";
import MeshIntro from "./meshIntro.mdx";
import { H3 } from "gcmp-design-system/src/app/components/atoms/Headings";
import clsx from "clsx";
import Link from "next/link";
import { DiagramBeforeJazz } from "@/components/DiagramBeforeJazz";
import { DiagramAfterJazz } from "@/components/DiagramAfterJazz";
import { Button } from "@/components/Button";

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
            stroke="#373432"
            strokeWidth="6"
            strokeLinecap="round"
        />
        <path
            d="M74.1719 24.958C83.1201 33.0289 92.3253 37.1887 98.5899 34.6593"
            stroke="#373432"
            strokeWidth="6"
            strokeLinecap="round"
        />
        <path
            d="M87.2448 58.8003C88.3842 46.6564 92.3253 37.1887 98.5899 34.6593"
            stroke="#373432"
            strokeWidth="6"
            strokeLinecap="round"
        />
    </svg>
);

export default function Home() {
    return (
        <>
            <div className="container py-16 md:py-24">
                <h1 className="font-display text-stone-950 dark:text-white text-5xl lg:text-7xl mb-5 font-medium tracking-tighter">
                    Instant sync.
                </h1>
                <p className="mb-8 text-3xl lg:text-4xl leading-snug tracking-tight dark:text-stone-500">
                    A new way to build apps with distributed state.
                </p>

                <p className="mb-8 text-lg text-pretty leading-relaxed max-w-3xl dark:text-stone-200 md:text-xl">
                    Jazz is an open-source framework that lets you{" "}
                    <span className="font-semibold text-stone-900 dark:text-white">
                        build apps around data that’s synced in real-time
                        between devices and users
                    </span>
                    . It replaces 90% of what frontend + backend stacks do.
                </p>

                <div className="flex gap-3">
                    <Button href="/docs" variant="primary" size="lg">
                        Read documentation
                    </Button>
                    <Button
                        href="https://discord.gg/utDMjHYg42"
                        variant="secondary"
                        size="lg"
                    >
                        Join Discord
                    </Button>
                </div>
            </div>

            <div className="py-16 bg-stone-100 dark:bg-stone-925 lg:py-32">
                <div className="container grid gap-8 lg:gap-12">
                    <h2 className="font-display md:text-center text-stone-950 dark:text-white text-2xl md:text-3xl font-semibold tracking-tight">
                        Your stack just lost its job.
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
                            <ArrowDoodle className="w-full h-auto" />
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

            <div className="container py-3 mt-8 lg:py-6 lg:mt-20">
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
                            <p className="flex items-center -mb-px transition-colors px-3 pb-1.5 pt-2 block text-xs border-b-2 border-blue-700 text-stone-700 dark:bg-stone-925 dark:text-blue-500 dark:border-blue-500">
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

            <div className="container py-3 lg:py-6">
                <HairlineBleedGrid>
                    <LabelledFeatureIcon
                        label="Cross-device sync"
                        icon={MonitorSmartphoneIcon}
                    />
                    <LabelledFeatureIcon
                        label="Real-time multiplayer"
                        icon={MousePointerSquareDashedIcon}
                    />
                    <LabelledFeatureIcon
                        label="Team/social features"
                        icon={UsersIcon}
                    />
                    <LabelledFeatureIcon
                        label="Built-in permissions"
                        icon={FileLock2Icon}
                    />
                    <LabelledFeatureIcon
                        label="Cloud sync & storage"
                        icon={UploadCloudIcon}
                    />
                    <LabelledFeatureIcon
                        label="On-device storage"
                        icon={HardDriveDownloadIcon}
                    />
                    <LabelledFeatureIcon
                        label="Instant UI updates"
                        icon={GaugeIcon}
                    />
                    <LabelledFeatureIcon
                        label="E2EE & signatures"
                        icon={KeyRoundIcon}
                    />

                    <div className="col-start-1 row-start-1 row-span-2 col-span-2 px-4 md:px-6 pb-4 text-base">
                        <Prose>
                            <Intro />
                        </Prose>
                    </div>
                </HairlineBleedGrid>
            </div>

            <div className="container py-3 lg:py-6">
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
                className="container grid-cols-2 lg:grid-cols-4"
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
                className="container grid-cols-2 lg:grid-cols-4"
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
                className="container grid-cols-2 lg:grid-cols-4"
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

            <div className="container py-3 lg:py-6">
                <SectionHeader
                    title="The Jazz Toolkit"
                    slogan="A high-level toolkit for building apps around CoValues."
                />

                <Prose>Supported environments:</Prose>
                <SmallProse>
                    <SupportedEnvironments />
                </SmallProse>
            </div>

            <GappedGrid className="container py-3 lg:py-6">
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

            <div className="container py-3 lg:py-6">
                <SectionHeader
                    title="Jazz Mesh"
                    slogan="Serverless sync & storage for Jazz apps"
                />

                <Prose>
                    <MeshIntro />
                </Prose>

                <P>
                    {"->"}{" "}
                    <TextLink href="/mesh" target="_blank">
                        Learn more about Jazz Mesh
                    </TextLink>
                </P>
            </div>

            <div className="container py-3 lg:py-6">
                <div className="flex flex-col justify-between gap-3">
                    <h3 className="font-display text-stone-950 dark:text-white text-xl font-semibold tracking-tight lg:text-2xl">
                        Get started
                    </h3>
                    <div className="flex gap-3">
                        <Button href="/docs" variant="primary">
                            Read documentation
                        </Button>
                        <Button
                            href="https://discord.gg/utDMjHYg42"
                            variant="secondary"
                        >
                            Join Discord
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
