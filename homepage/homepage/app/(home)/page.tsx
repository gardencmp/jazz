import {
    MultiplayerIcon,
    ResponsiveIframe,
    ComingSoonBadge,
} from "@/components/forMdx";
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

import {
    UploadCloudIcon,
    MonitorSmartphoneIcon,
    GaugeIcon,
    UsersIcon,
    FileLock2Icon,
    HardDriveDownloadIcon,
    KeyRoundIcon,
} from "lucide-react";

import { App_tsx, ChatScreen_tsx } from "@/codeSamples/examples/chat/src";
import Link from "next/link";

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

export default function Home() {
    return (
        <>
            <HeroHeader
                title="Instant sync."
                slogan="A new way to build apps with distributed state."
            />

            <HairlineBleedGrid>
                <LabelledFeatureIcon
                    label="Cross-device sync"
                    icon={MonitorSmartphoneIcon}
                />
                <LabelledFeatureIcon
                    label="Real-time multiplayer"
                    icon={MultiplayerIcon}
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

            <div className="-mx-[calc(min(0,(100vw-95rem)/2))]">
                <SectionHeader
                    title="First impressions..."
                    slogan="A chat app in 84 lines of code."
                />

                <GappedGrid className="mt-0 -mx-4 md:-mx-6">
                    <div className="md:col-start-1 col-span-2">
                        <App_tsx />
                    </div>
                    <div className="md:col-start-3 col-span-2">
                        <ChatScreen_tsx />
                    </div>
                    <ResponsiveIframe
                        src="https://chat.jazz.tools"
                        localSrc="http://localhost:5173"
                        className="lg:col-start-5 col-span-2 rounded-xl overflow-hidden min-h-[50vh]"
                    />
                </GappedGrid>
            </div>

            <SectionHeader
                title="Collaborative Values"
                slogan="Your new building blocks."
            />
            <Prose>
                <CoValuesIntro />
            </Prose>

            <GappedGrid
                title="Bread-and-butter datastructures"
                className="grid-cols-2 lg:grid-cols-4"
            >
                <GridCard>
                    #### `CoMap`
                    <SmallProse>
                        <CoMapDescription />
                    </SmallProse>
                </GridCard>

                <GridCard>
                    #### `CoList`
                    <SmallProse>
                        <CoListDescription />
                    </SmallProse>
                </GridCard>

                <GridCard>
                    #### `CoPlainText` & `CoRichText` <ComingSoonBadge />
                    <SmallProse>
                        <CoPlainTextDescription />
                    </SmallProse>
                </GridCard>

                <GridCard>
                    #### `CoStream`
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
                    #### `BinaryCoStream`
                    <SmallProse>
                        <BinaryCoStreamDescription />
                    </SmallProse>
                </GridCard>

                <GridCard>
                    #### `ImageDefinition`
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
                    #### `Group`
                    <SmallProse>
                        <GroupDescription />
                    </SmallProse>
                </GridCard>
                <GridCard>
                    #### `Account`
                    <SmallProse>
                        <AccountDescription />
                    </SmallProse>
                </GridCard>
            </GappedGrid>

            <SectionHeader
                title="The Jazz Toolkit"
                slogan="A high-level toolkit for building apps around CoValues."
            />

            <Prose>Supported environments:</Prose>
            <SmallProse>
                <SupportedEnvironments />
            </SmallProse>

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
                        slogan="Just use `<input type='file'/>`."
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

            <SectionHeader
                title="Jazz Mesh"
                slogan="Serverless sync & storage for Jazz apps"
            />

            <Prose>
                <MeshIntro />
            </Prose>

            <Link href="/mesh" target="_blank">
                Learn more about Jazz Mesh
            </Link>
            ## Get Started -{" "}
            <Link href="/docs" target="_blank">
                Read the docs
            </Link>
            -{" "}
            <Link href="https://discord.gg/utDMjHYg42" target="_blank">
                Join our Discord
            </Link>
        </>
    );
}
