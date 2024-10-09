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
    MousePointerSquareDashedIcon, Icon,
} from "lucide-react";

import {
    Main_tsx,
    Schema_ts,
    App_tsx,
    ChatScreen_tsx,
    Ui_tsx,
} from "@/codeSamples/examples/chat/src";

import HardThingsIntro from "./hardThings.mdx";
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
import {H2, H3} from "gcmp-design-system/src/app/components/atoms/Headings";
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
    return (
      <>
          <div className="container grid gap-16 py-16">
              <div className="grid grid-cols-2">
                  <div className="space-y-8">
                      <h1
                        className="font-display text-stone-950 dark:text-white text-4xl md:text-5xl lg:text-6xl font-medium tracking-tighter text-balance">
                          Build your next&nbsp;app with sync.
                      </h1>

                      <div
                        className="space-y-3 text-lg text-pretty leading-relaxed max-w-3xl dark:text-stone-200 md:text-xl">
                          <p className="">
                              Jazz is an open-source framework for building local-first
                              apps, removing 90% of the backend and infrastructure
                              complexity.
                          </p>
                      </div>

                      <div>
                          <Button href="#" variant="primary" size="lg">Learn more</Button>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 items-center text-center bg-stone-100 w-full">
                      illustration here or code example?
                  </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                  <div className="flex gap-5">
                      <div>
                          <div className="p-2.5 rounded-lg bg-blue-50 text-blue">
                              <HardDriveDownloadIcon size={24} strokeWidth={1.5}/>
                          </div>
                      </div>
                      <div className="space-y-2">
                          <p className="text-lg font-medium text-stone-900">Local-first storage</p>
                          <p className="text-sm leading-relaxed">
                              Mutate data as local state, and get an app with instant UI updates
                              that works smoothly offline, then later syncs to the server.
                          </p>
                      </div>
                  </div>

                  <div className="flex gap-5">
                      <div>
                          <div className="p-2.5 rounded-lg bg-blue-50 text-blue">
                              <UploadCloudIcon size={24} strokeWidth={1.5}/>
                          </div>
                      </div>
                      <div className="space-y-2">
                          <p className="text-lg font-medium text-stone-900">Data & blob storage</p>
                          <p className="text-sm leading-relaxed">
                              Store files and data using our syncing and persistence infrastructure - Jazz Mesh,
                              or easily host your own.
                          </p>
                      </div>
                  </div>

                  <div className="flex gap-5">
                      <div>
                          <div className="p-2.5 rounded-lg bg-blue-50 text-blue">
                              <FileLock2Icon size={24} strokeWidth={1.5}/>
                          </div>
                      </div>
                      <div className="space-y-2">
                          <p className="text-lg font-medium text-stone-900">Built-in permissions</p>
                          <p className="text-sm leading-relaxed">
                              Every piece of data is assigned role-based permissions on creation,
                              allowing you to easily build team and social features.
                          </p>
                      </div>
                  </div>
              </div>
          </div>

          <div className="bg-stone-100 dark:bg-stone-925 py-8 lg:py-16">
              <div className="container grid gap-8 lg:gap-12">
                  <h2
                    className="font-display md:text-center text-stone-950 dark:text-white text-2xl md:text-3xl font-semibold tracking-tight">
                      Hard things are easy now.
                  </h2>
                  <div className="grid gap-8 md:grid-cols-11 lg:gap-5">
                      <div className="md:col-span-5 flex flex-col justify-between">
                          <div
                            className="text-pretty leading-relaxed text-lg max-w-2xl space-y-2 md:text-xl md:space-y-4 md:leading-relaxed">
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
                                  <DiagramBeforeJazz
                                    className="w-full h-auto max-w-[30rem] mx-auto dark:text-white"></DiagramBeforeJazz>
                              </div>
                          </div>
                      </div>

                      <div className="hidden md:block relative pr-3 top-24">
                          <ArrowDoodle className="w-full h-auto text-stone-300 dark:text-stone-800"/>
                      </div>

                      <div className="md:col-span-5 flex flex-col justify-between">
                          <div
                            className="text-pretty leading-relaxed text-lg max-w-2xl space-y-2 md:text-xl md:space-y-4 md:leading-relaxed">
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
                                  <DiagramAfterJazz
                                    className="w-full h-auto max-w-[30rem] mx-auto dark:text-white"></DiagramAfterJazz>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          <div className="container flex flex-col gap-3 py-8 lg:gap-8 lg:py-20">
              <H2>How does Jazz work?</H2>
              <p>[this is an opportunity to explain how to make a simple schema, data flow and clarify that its not
                  p2p]</p>

              <div className="grid grid-cols-3  gap-4">
                  <div className="border rounded p-3 col-span-2">
                      <span
                        className="bg-blue text-white rounded-full w-5 h-5 inline-flex items-center justify-center">1</span>
                      <p>create a schema</p>
                      <code>code sample</code>
                  </div>

                  <div className="border rounded p-3 ">
                      <span
                        className="bg-blue text-white rounded-full w-5 h-5 inline-flex items-center justify-center">2</span>
                      set up server for sync and persistence (mesh or your own)
                  </div>

                  <div className="border rounded p-3 ">
                      <span
                        className="bg-blue text-white rounded-full w-5 h-5 inline-flex items-center justify-center">3</span>
                      <p>mutate data locally</p>
                      <code>code sample</code>
                  </div>
                  <div className="border rounded p-3 ">
                      <span
                        className="bg-blue text-white rounded-full w-5 h-5 inline-flex items-center justify-center">4</span>
                      <p>sync data to server (happens automatically)</p>
                  </div>
                  <div className="border rounded p-3 ">
                      <span
                        className="bg-blue text-white rounded-full w-5 h-5 inline-flex items-center justify-center">5</span>
                      <p>other devices and users can see the changes</p>
                      <div>[illustration of 2 devices showing changes]</div>
                  </div>
              </div>
          </div>

          <div className="container">
              <SectionHeader
                title="First impressions..."
                slogan="A chat app in 174 lines of code."
              />

              <div
                className="flex flex-col md:grid md:grid-cols-2 md:divide-x border rounded-sm overflow-hidden shadow-sm dark:border-stone-900 dark:divide-stone-900">
                  <CodeExampleTabs
                    tabs={[
                        {
                            name: "main.tsx",
                            content: <Main_tsx/>,
                        },
                        {
                            name: "app.tsx",
                            content: <App_tsx/>,
                        },
                        {
                            name: "schema.ts",
                            content: <Schema_ts/>,
                        },
                        {
                            name: "chatScreen.tsx",
                            content: <ChatScreen_tsx/>,
                        },
                        {
                            name: "ui.tsx",
                            content: <Ui_tsx/>,
                        },
                    ]}
                  />
                  <div className="border-b order-first md:order-last flex flex-col md:border-b-0">
                      <div
                        className="flex border-b overflow-x-auto overflow-y-hidden bg-white dark:border-stone-900 dark:bg-stone-900">
                          <p
                            className="items-center -mb-px transition-colors px-3 pb-1.5 pt-2 block text-xs border-b-2 border-blue-700 text-stone-700 dark:bg-stone-925 dark:text-blue-500 dark:border-blue-500">
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

          <div className="container flex flex-col gap-8 py-8 lg:gap-20 lg:py-20">
              <div className="flex flex-col gap-4 md:gap-6">
                  <Prose>
                      <HardThingsIntro/>
                  </Prose>

                  <HairlineBleedGrid>
                      <LabelledFeatureIcon
                        label="Local-first on-device storage"
                        icon={HardDriveDownloadIcon}
                        explanation={
                            <>
                                <p>
                                    Jazz persists all data you access or
                                    create locally, so your users can keep
                                    using your app offline or on sketchy
                                    connections.
                                </p>
                                <p>
                                    When you’re back online, the local
                                    changes are synced to the server.
                                </p>
                            </>
                        }
                      />
                      <LabelledFeatureIcon
                        label="Cross-device sync"
                        icon={MonitorSmartphoneIcon}
                        explanation={
                            <>
                                <p>
                                    Build your app around what looks like
                                    simple local state (that you mutate
                                    directly in your frontend).
                                </p>
                                <p>
                                    Log in as the same user on a second
                                    device and everything is already just
                                    there, always in sync.
                                </p>
                            </>
                        }
                      />
                      <LabelledFeatureIcon
                        label="Real-time multiplayer"
                        icon={MousePointerSquareDashedIcon}
                        explanation={
                            <>
                                <p>
                                    Like sync between devices, if you share
                                    state with other users it’s
                                    automatically real-time multiplayer.
                                </p>
                                <p>
                                    Use the same primitives to quickly build
                                    cursors and other kinds of user presence
                                    UI.
                                </p>
                            </>
                        }
                      />
                      <LabelledFeatureIcon
                        label="Accounts, teams & social features"
                        icon={UsersIcon}
                        explanation={
                            <>
                                <p>
                                    Accounts and Groups (Teams) are first
                                    class entities that you can create and
                                    reference locally in the client.
                                </p>
                                <p>
                                    Building whole apps becomes as easy as
                                    building the UI for them.
                                </p>
                            </>
                        }
                      />
                      <LabelledFeatureIcon
                        label="Built-in permissions"
                        icon={FileLock2Icon}
                        explanation={
                            <>
                                <p>
                                    Every piece of data in Jazz has
                                    role-based permissions, which you can
                                    define locally when you create new
                                    objects.
                                </p>
                                <p>
                                    Because pieces of data with different
                                    permissions can still reference each
                                    other, you can create very granular and
                                    expressive permission structures.
                                </p>
                            </>
                        }
                      />
                      <LabelledFeatureIcon
                        label="Data & blob storage"
                        icon={UploadCloudIcon}
                        explanation={
                            <>
                                <p>
                                    You can use Jazz for both structured
                                    data as well as binary streams or blobs,
                                    all of which you can reference and load
                                    the same way.
                                </p>
                                <p>
                                    The syncing & persistence infrastructure
                                    (
                                    <Link
                                      className="underline"
                                      href="/mesh"
                                    >
                                        Jazz Mesh
                                    </Link>{" "}
                                    or self-hosted) becomes both your cloud
                                    database and blob storage.
                                </p>
                            </>
                        }
                      />
                      <LabelledFeatureIcon
                        label="Instant UI updates"
                        icon={GaugeIcon}
                        explanation={
                            <>
                                <p>
                                    Because all data is mutated locally, you
                                    get instant updates in all parts of your
                                    UI subscribed to the updated data.
                                </p>
                                <p>
                                    Remote changes are quick as well,
                                    because only missing edits have to be
                                    exchanged. Plus, with Jazz Mesh, you get
                                    geographically-close caching.
                                </p>
                            </>
                        }
                      />
                      <LabelledFeatureIcon
                        label="E2EE & signatures"
                        icon={KeyRoundIcon}
                        explanation={
                            <>
                                <p>
                                    All data in Jazz is end-to-end encrypted
                                    and cryptographically signed by default,
                                    so you know it can’t be tampered with
                                    and you don’t have to trust the syncing
                                    & persistence infrastructure.
                                </p>
                                <p>
                                    You can still create server workers, but
                                    like other users, their account has to
                                    be given explicit permissions to access
                                    data.
                                </p>
                            </>
                        }
                      />
                      <LabelledFeatureIcon
                        label="Authentication"
                        icon={KeyRoundIcon}
                      />
                  </HairlineBleedGrid>
              </div>

              <div>
                  <SectionHeader
                    title="Jazz Mesh"
                    slogan="Serverless sync & storage for Jazz apps"
                  />

                  <Prose>
                      <MeshIntro/>
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
                      <CoValuesIntro/>
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
                          <CoMapDescription/>
                      </SmallProse>
                  </GridCard>

                  <GridCard>
                      <H3>
                          <CodeRef>CoList</CodeRef>
                      </H3>
                      <SmallProse>
                          <CoListDescription/>
                      </SmallProse>
                  </GridCard>

                  <GridCard>
                      <H3>
                          <CodeRef>CoPlainText</CodeRef> &{" "}
                          <CodeRef>CoRichText</CodeRef> <ComingSoonBadge/>
                      </H3>
                      <SmallProse>
                          <CoPlainTextDescription/>
                      </SmallProse>
                  </GridCard>

                  <GridCard>
                      <H3>
                          <CodeRef>CoStream</CodeRef>
                      </H3>
                      <SmallProse>
                          <CoStreamDescription/>
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
                          <BinaryCoStreamDescription/>
                      </SmallProse>
                  </GridCard>

                  <GridCard>
                      <H3>
                          <CodeRef>ImageDefinition</CodeRef>
                      </H3>
                      <SmallProse>
                          <ImageDefinitionDescription/>
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
                          <GroupDescription/>
                      </SmallProse>
                  </GridCard>
                  <GridCard>
                      <H3>
                          <CodeRef>Account</CodeRef>
                      </H3>
                      <SmallProse>
                          <AccountDescription/>
                      </SmallProse>
                  </GridCard>
              </GappedGrid>

              <div>
                  <SectionHeader
                    title="The Jazz Toolkit"
                    slogan="A high-level toolkit for building apps around CoValues."
                  />

                  <Prose>Supported environments:</Prose>
                  <SmallProse>
                      <SupportedEnvironments/>
                  </SmallProse>
              </div>

              <GappedGrid>
                  <GridCard>
                      <SectionHeader
                        title="Auto-sub"
                        slogan="Let your UI drive data-syncing."
                      />
                      <SmallProse>
                          <AutoSubDescription/>
                      </SmallProse>
                  </GridCard>

                  <GridCard>
                      <SectionHeader
                        title="Cursors & carets"
                        slogan="Ready-made spatial presence."
                      />
                      <SmallProse>
                          <CursorsAndCaretsDescription/>
                      </SmallProse>
                  </GridCard>

                  <GridCard>
                      <SectionHeader
                        title="Auth Providers"
                        slogan="Plug and play different kinds of auth."
                      />
                      <SmallProse>
                          <AuthProvidersDescription/>
                      </SmallProse>
                  </GridCard>

                  <GridCard>
                      <SectionHeader
                        title="Two-way sync to your DB"
                        slogan="Add Jazz to an existing app."
                      />
                      <SmallProse>
                          <TwoWaySyncDescription/>
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
                          <FileUploadDownloadDescription/>
                      </SmallProse>
                  </GridCard>

                  <GridCard>
                      <SectionHeader
                        title="Video presence & calls"
                        slogan="Stream and record audio & video."
                      />
                      <SmallProse>
                          <VideoPresenceCallsDescription/>
                      </SmallProse>
                  </GridCard>
              </GappedGrid>

              <div>
                  <div className="flex flex-col justify-between gap-3">
                      <h3
                        className="font-display text-stone-950 dark:text-white text-xl font-semibold tracking-tight lg:text-2xl">
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
          </div>
      </>
    );
}
