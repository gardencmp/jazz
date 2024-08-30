import {
  MultiplayerIcon,
  ResponsiveIframe,
  ComingSoonBadge,
} from "@/components/forMdx";
import {
  Prose,
  SmallProse,
} from "gcmp-design-system/src/components/molecules/Prose";

// TEST NICE IMPORTS
import { GridCard, Text } from "@atoms";
import {
  HeaderHero,
  HeaderSection,
  GridHairline,
  GridGapped,
} from "@molecules";

import { LabelledFeatureIcon } from "gcmp-design-system/src/components/molecules/LabelledFeatureIcon";

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
    <div className="space-y-w12">
      <HeaderHero
        title="Instant sync."
        slogan="A new way to build apps with distributed state."
        className="space-y-2 pt-w20"
      />
      {/* GRID */}
      <GridHairline className="-mx-inset-2x">
        <LabelledFeatureIcon
          label="Cross-device sync"
          icon={MonitorSmartphoneIcon}
        />
        <LabelledFeatureIcon
          label="Real-time multiplayer"
          icon={MultiplayerIcon}
        />
        <LabelledFeatureIcon label="Team/social features" icon={UsersIcon} />
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
        <LabelledFeatureIcon label="Instant UI updates" icon={GaugeIcon} />
        <LabelledFeatureIcon label="E2EE & signatures" icon={KeyRoundIcon} />

        <div className="col-span-2 col-start-1 row-span-2 row-start-1 px-4 pb-4 text-base md:px-6">
          <Prose>
            <Intro />
          </Prose>
        </div>
      </GridHairline>
      {/* EXAMPLE APP */}
      <section className="space-y-w8">
        <HeaderSection
          title="First impressions..."
          slogan="A chat app in 84 lines of code."
        />
        {/* this doesn't render: -mx-[calc(min(0,(100vw-95rem)/2))] */}
        <div className="-mx-inset-2x">
          <GridGapped className="mt-0 -mx-4 md:-mx-6">
            <div className="col-span-2 md:col-start-1">
              <App_tsx />
            </div>
            <div className="col-span-2 md:col-start-3">
              <ChatScreen_tsx />
            </div>
            <ResponsiveIframe
              src="https://chat.jazz.tools"
              localSrc="http://localhost:5173"
              className="lg:col-start-5 col-span-2 rounded-xl overflow-hidden min-h-[50vh]"
            />
          </GridGapped>
        </div>
      </section>
      {/* COVALUES */}
      <HeaderSection
        title="Collaborative Values"
        slogan="Your new building blocks."
      />
      <Prose>
        <CoValuesIntro />
      </Prose>
      <GridGapped
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
      </GridGapped>
      <GridGapped
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
      </GridGapped>
      <GridGapped
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
      </GridGapped>
      <HeaderSection
        title="The Jazz Toolkit"
        slogan="A high-level toolkit for building apps around CoValues."
      />
      <Prose>Supported environments:</Prose>
      <SmallProse>
        <SupportedEnvironments />
      </SmallProse>
      <GridGapped>
        <GridCard>
          <HeaderSection
            title="Auto-sub"
            slogan="Let your UI drive data-syncing."
          />
          <SmallProse>
            <AutoSubDescription />
          </SmallProse>
        </GridCard>

        <GridCard>
          <HeaderSection
            title="Cursors & carets"
            slogan="Ready-made spatial presence."
          />
          <SmallProse>
            <CursorsAndCaretsDescription />
          </SmallProse>
        </GridCard>

        <GridCard>
          <HeaderSection
            title="Auth Providers"
            slogan="Plug and play different kinds of auth."
          />
          <SmallProse>
            <AuthProvidersDescription />
          </SmallProse>
        </GridCard>

        <GridCard>
          <HeaderSection
            title="Two-way sync to your DB"
            slogan="Add Jazz to an existing app."
          />
          <SmallProse>
            <TwoWaySyncDescription />
          </SmallProse>
        </GridCard>

        <GridCard>
          <HeaderSection
            title="File upload & download"
            slogan="Just use `<input type='file'/>`."
          />
          <SmallProse>
            <FileUploadDownloadDescription />
          </SmallProse>
        </GridCard>

        <GridCard>
          <HeaderSection
            title="Video presence & calls"
            slogan="Stream and record audio & video."
          />
          <SmallProse>
            <VideoPresenceCallsDescription />
          </SmallProse>
        </GridCard>
      </GridGapped>
      <HeaderSection
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
    </div>
  );
}
