import { CodeExampleTabs, ResponsiveIframe } from "@/components/forMdx";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
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
import { SupportedEnvironments } from "@/components/home/SupportedEnvironments";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import BeforeAfterJazz from "@/components/home/BeforeAfterJazz";
import { P } from "gcmp-design-system/src/app/components/atoms/Paragraph";
import { WhyLocalFirst } from "@/components/home/WhyLocalFirst";
import {CollaborationFeatures} from "@/components/home/CollaborationFeatures";
import {FeaturesSection} from "@/components/home/FeaturesSection";

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


    const localFirstFeatures = [
        {
            title: "Instant updates",
            icon: GaugeIcon,
            description: (
              <>
                  <p>
                      Since you&apos;re working with local state,
                      your UI updates instantly. No spinners and API calls.
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
                      Every device with the same account will always have everything in sync.
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
                      Share state with other users, and get automatic real-time
                      multiplayer.
                  </p>
              </>
            ),
        },
    ];

    const features = [
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
            <Hero features={[...localFirstFeatures, ...features]} />

            <BeforeAfterJazz />

            <div className="container flex flex-col gap-12 mt-12 lg:gap-20 lg:mt-20">
                <HowItWorks />

                <Testimonial name="Serious Adopter #4" role="Technical Founder">
                    <p>
                        You don&apos;t have to think about deploying a database,
                        SQL schemas, relations, and writing queries… Basically,{" "}
                        <span className="bg-blue-50 px-1 dark:bg-transparent">
                            if you know TypeScript, you know Jazz
                        </span>
                        , and you can ship an app. It&apos;s just so nice!
                    </p>
                </Testimonial>

                <WhyLocalFirst />

                <CollaborationFeatures/>

                <FeaturesSection/>

                <div>
                    <SectionHeader
                        title="First impressions..."
                        slogan="A chat app in 174 lines of code."
                    />

                    <div className="flex flex-col md:grid md:grid-cols-2 md:divide-x border rounded-sm overflow-hidden shadow-sm dark:divide-stone-900">
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
                            <div className="flex border-b overflow-x-auto overflow-y-hidden bg-white dark:bg-stone-900">
                                <p className="items-center -mb-px transition-colors px-3 pb-1.5 pt-2 block text-xs border-b-2 border-blue-700 text-stone-700 dark:bg-stone-925 dark:text-blue-500 dark:border-blue-500">
                                    result
                                </p>
                            </div>
                            <ResponsiveIframe
                                src="https://chat.jazz.tools"
                                localsrc="http://localhost:5173"
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
                        <Prose size="sm">
                            <CoMapDescription />
                        </Prose>
                    </GridCard>

                    <GridCard>
                        <H3>
                            <CodeRef>CoList</CodeRef>
                        </H3>
                        <Prose size="sm">
                            <CoListDescription />
                        </Prose>
                    </GridCard>

                    <GridCard>
                        <H3>
                            <CodeRef>CoPlainText</CodeRef> &{" "}
                            <CodeRef>CoRichText</CodeRef> <ComingSoonBadge />
                        </H3>
                        <Prose size="sm">
                            <CoPlainTextDescription />
                        </Prose>
                    </GridCard>

                    <GridCard>
                        <H3>
                            <CodeRef>CoStream</CodeRef>
                        </H3>
                        <Prose size="sm">
                            <CoStreamDescription />
                        </Prose>
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
                        <Prose size="sm">
                            <BinaryCoStreamDescription />
                        </Prose>
                    </GridCard>

                    <GridCard>
                        <H3>
                            <CodeRef>ImageDefinition</CodeRef>
                        </H3>
                        <Prose size="sm">
                            <ImageDefinitionDescription />
                        </Prose>
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
                        <Prose size="sm">
                            <GroupDescription />
                        </Prose>
                    </GridCard>
                    <GridCard>
                        <H3>
                            <CodeRef>Account</CodeRef>
                        </H3>
                        <Prose size="sm">
                            <AccountDescription />
                        </Prose>
                    </GridCard>
                </GappedGrid>

                <SupportedEnvironments />

                <h2 className="sr-only">More features</h2>

                <GappedGrid>
                    <GridCard>
                        <H3>Auto-sub</H3>
                        <P className="text-lg">
                            Let your UI drive data-syncing.
                        </P>
                        <Prose size="sm">
                            <AutoSubDescription />
                        </Prose>
                    </GridCard>

                    <GridCard>
                        <H3>Cursors & carets</H3>
                        <P className="text-lg">Ready-made spatial presence.</P>
                        <Prose size="sm">
                            <CursorsAndCaretsDescription />
                        </Prose>
                    </GridCard>

                    <GridCard>
                        <H3>Two-way sync to your DB</H3>
                        <P className="text-lg">Add Jazz to an existing app.</P>
                        <Prose size="sm">
                            <TwoWaySyncDescription />
                        </Prose>
                    </GridCard>

                    <GridCard>
                        <H3>File upload & download</H3>
                        <P className="text-lg">
                            Just use <CodeRef>{`<input type='file'/>`}</CodeRef>
                            .
                        </P>
                        <Prose size="sm">
                            <FileUploadDownloadDescription />
                        </Prose>
                    </GridCard>

                    <GridCard>
                        <H3>Video presence & calls</H3>
                        <P className="text-lg">
                            Stream and record audio & video.
                        </P>
                        <Prose size="sm">
                            <VideoPresenceCallsDescription />
                        </Prose>
                    </GridCard>
                </GappedGrid>

                <div className="border rounded-xl shadow-sm p-4 md:py-16">
                    <div className="lg:max-w-3xl md:text-center mx-auto space-y-6">
                        <p className="uppercase text-blue tracking-widest text-sm font-medium dark:text-stone-400">
                            Become an early adopter
                        </p>
                        <H2>
                            We&apos;ll help you build your next app with Jazz
                        </H2>
                        <Prose className="md:text-balance mx-auto">
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
                        </Prose>
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
