import { CodeExampleTabs, ResponsiveIframe } from "@/components/forMdx";
import {
    Prose,
    SmallProse,
} from "gcmp-design-system/src/app/components/molecules/Prose";
import { SectionHeader } from "gcmp-design-system/src/app/components/molecules/SectionHeader";
import { GappedGrid } from "gcmp-design-system/src/app/components/molecules/GappedGrid";
import { LabelledFeatureIcon } from "gcmp-design-system/src/app/components/molecules/LabelledFeatureIcon";
import { Testimonial } from "gcmp-design-system/src/app/components/molecules/Testimonial";
import { GridCard } from "gcmp-design-system/src/app/components/atoms/GridCard";
import { CodeRef } from "gcmp-design-system/src/app/components/atoms/CodeRef";
import { ComingSoonBadge } from "gcmp-design-system/src/app/components/atoms/ComingSoonBadge";
import { Button } from "gcmp-design-system/src/app/components/atoms/Button";

import {
    UploadCloudIcon,
    MonitorSmartphoneIcon,
    GaugeIcon,
    UsersIcon,
    FileLock2Icon,
    HardDriveDownloadIcon,
    KeyRoundIcon,
    MousePointerSquareDashedIcon,
    UserIcon,
    TriangleAlertIcon,
    CheckIcon,
} from "lucide-react";

import {
    Main_tsx,
    Schema_ts,
    App_tsx,
    ChatScreen_tsx,
    Ui_tsx,
} from "@/codeSamples/examples/chat/src";

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
import TwoWaySyncDescription from "./toolkit/twoWaySync.mdx";
import FileUploadDownloadDescription from "./toolkit/fileUploadDownload.mdx";
import VideoPresenceCallsDescription from "./toolkit/videoPresenceCalls.mdx";
import CloudIntro from "./cloudIntro.mdx";
import { H2, H3 } from "gcmp-design-system/src/app/components/atoms/Headings";
import Link from "next/link";
import { DiagramBeforeJazz } from "@/components/DiagramBeforeJazz";
import { DiagramAfterJazz } from "@/components/DiagramAfterJazz";
import { SupportedEnvironments } from "@/components/home/SupportedEnvironments";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";

export default function Home() {
    const localFirst = {
        title: "Local-first",
        icon: HardDriveDownloadIcon,
        description: (
            <>
                <p>
                    All data you load or create is persisted locally, so your
                    users can work offline.
                </p>
                <p>
                    When you’re back online, your local changes are synced to
                    the server.
                </p>
            </>
        ),
    };

    const features = [
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
                        <Link className="underline" href="/cloud">
                            Jazz Cloud
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
            title: "Real-time sync",
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
            title: "E2E encryption",
            icon: KeyRoundIcon,
            description: (
                <>
                    <p>
                        All data is end-to-end encrypted and cryptographically
                        signed by default.
                    </p>
                    <p>
                        So it can&apos;t be tampered with and Jazz Cloud only
                        sees encrypted data.
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
        {
            title: "Authentication",
            icon: UserIcon,
            description: (
                <>
                    <p>Plug and play different kinds of auth.</p>
                    <ul className="pl-4 list-disc">
                        <li>DemoAuth (for quick multi-user demos)</li>
                        <li>WebAuthN (TouchID/FaceID)</li>
                        <li>Clerk</li>
                        <li>
                            Auth0, Okta, NextAuth <ComingSoonBadge />
                        </li>
                    </ul>
                </>
            ),
        },
    ];

    return (
        <>
            <Hero features={features} />

            <div className="container grid gap-4 lg:gap-8">
                <H2 className="md:text-center">Hard things are easy now.</H2>

                <div className="grid sm:grid-cols-2 lg:max-w-4xl mx-auto gap-4">
                    <div className="flex flex-col gap-3 bg-stone-50 p-4 rounded-2xl md:p-8 md:gap-5 dark:bg-stone-925">
                        <span className="text-red-600 bg-red-100 inline-flex items-center justify-center size-10 rounded-full dark:bg-stone-900 dark:text-red-500">
                            <TriangleAlertIcon size={24} />
                        </span>
                        <div className="leading-relaxed space-y-2">
                            <p>
                                Every stack just reinvents shared state between
                                users and machines.
                            </p>

                            <p>
                                And far from the simple client-server model, you
                                routinely tackle a mess of moving parts, tech
                                choices and deployment questions.
                            </p>
                            <p>And your app’s code is all over the place.</p>
                        </div>
                        <div className="relative">
                            <div className="w-20 h-full bg-gradient-to-r from-stone-50 to-transparent absolute top-0 left-0 z-10 dark:from-stone-925"></div>
                            <div className="h-20 w-full bg-gradient-to-b from-stone-50 to-transparent absolute top-0 left-0 z-10 dark:from-stone-925"></div>
                            <div className="h-20 w-full bg-gradient-to-t from-stone-50 to-transparent absolute bottom-0 left-0 z-10 dark:from-stone-925"></div>
                            <div className="w-20 h-full bg-gradient-to-l from-stone-50 to-transparent absolute top-0 right-0 z-10 dark:from-stone-925"></div>
                            <DiagramBeforeJazz className="w-full h-auto max-w-sm" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 bg-stone-50 p-4 rounded-2xl md:p-8 md:gap-5 dark:bg-stone-925">
                        <span className="text-green-500 bg-green-100 inline-flex items-center justify-center size-10 rounded-full dark:bg-stone-900 dark:text-green-500">
                            <CheckIcon size={24} />
                        </span>
                        <div className="leading-relaxed space-y-2">
                            <p>
                                Jazz provides a single new abstraction to do the
                                whole job.
                            </p>
                            <p>
                                It turns the data flow around and gives you{" "}
                                <span className="font-medium text-stone-900 dark:text-white">
                                    mutable local state
                                </span>
                                , solving{" "}
                                <span className="font-medium text-stone-900 dark:text-white">
                                    sync
                                </span>
                                ,{" "}
                                <span className="font-medium text-stone-900 dark:text-white">
                                    concurrent editing
                                </span>{" "}
                                and{" "}
                                <span className="font-medium text-stone-900 dark:text-white">
                                    permissions
                                </span>{" "}
                                under the hood.
                            </p>
                            <p>
                                All that’s left?{" "}
                                <span className="font-medium text-stone-900 dark:text-white">
                                    What makes your app your app.
                                </span>
                            </p>
                        </div>
                        <div className="flex items-center flex-1">
                            <DiagramAfterJazz className="w-full h-auto max-w-sm" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="container flex flex-col gap-8 py-8 lg:gap-20 lg:py-20">
                <HowItWorks />

                <Testimonial name="Serious Adopter #4" role="Technical Founder">
                    <p>
                        You don&apos;t have to think about deploying a database,
                        SQL schemas, relations, and writing queries… Basically,{" "}
                        <span className="whitespace-nowrap bg-blue-50 px-1 dark:bg-transparent">
                            if you know TypeScript, you know Jazz
                        </span>
                        , and you can ship an app. It&apos;s just so nice!
                    </p>
                </Testimonial>

                <div className="flex flex-col gap-4 md:gap-6">
                    <SectionHeader
                        title="Everything you need to ship top-tier apps quickly."
                        slogan="Features that used to take months to build now work out-of-the-box."
                    />

                    <GappedGrid>
                        {[localFirst, ...features].map(
                            ({ title, icon: Icon, description }) => (
                                <LabelledFeatureIcon
                                    className="col-span-2"
                                    key={title}
                                    label={title}
                                    icon={Icon}
                                    explanation={description}
                                />
                            ),
                        )}
                    </GappedGrid>
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
                        title="Jazz Cloud"
                        slogan="Serverless sync & storage for Jazz apps"
                    />

                    <Prose>
                        <CloudIntro />
                    </Prose>

                    <div className="mt-8">
                        <Button href="/cloud" variant="secondary">
                            Learn more about Jazz Cloud {"->"}
                        </Button>
                    </div>
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
                        <p className="uppercase text-blue tracking-widest text-sm font-medium dark:text-stone-400">
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
