import { ServerWorkersDiagram } from "@/components/home/ServerWorkersDiagram";
import { ClerkLogo } from "@/components/icons/ClerkLogo";
import { Button } from "gcmp-design-system/src/app/components/atoms/Button";
import { Card } from "gcmp-design-system/src/app/components/atoms/Card";
import { H3 } from "gcmp-design-system/src/app/components/atoms/Headings";
import { Icon } from "gcmp-design-system/src/app/components/atoms/Icon";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import { SectionHeader } from "gcmp-design-system/src/app/components/molecules/SectionHeader";
import Link from "next/link";

const features = [
  {
    title: "File uploads",
    description: (
      <>
        Just use <code>{`<input type="file"/>`}</code>, and easily convert from
        and to Browser <code>Blobs</code> using a <code>BinaryCoStream</code>{" "}
        CoValue.
      </>
    ),
    illustration: (
      <div className="grid gap-6 pt-4">
        <pre className="lg:px-5">
          <code className="text-xs text-stone-900 dark:text-white lg:text-sm">
            BinaryCoStream.createFromBlob(file);
          </code>
        </pre>

        <div className="w-full bg-white rounded-md py-3 px-3 flex gap-4 items-center border rounded-xl shadow-lg shadow-stone-500/10 dark:bg-stone-925">
          <Icon
            size="2xl"
            name="file"
            className="text-blue dark:text-blue-500"
          />
          <div className="text-2xl flex-1 text-blue dark:text-blue-500">
            file.pdf
          </div>
          <Icon size="2xl" name="delete" className="text-stone-500" />
        </div>
      </div>
    ),
  },
  {
    title: "Progressive image loading",
    description: (
      <>
        Using Jazz&apos;s <code>ImageDefinition</code> component, you get
        progressive image up & downloading, super fast blur preview, and image
        size info.
      </>
    ),
    illustration: (
      <>
        <div className="overflow-hidden rounded-md relative -mt-10 -mr-4">
          <img
            src="/leaves.jpg"
            className="w-32 h-auto blur-md scale-125 opacity-90"
          />
          <p className="absolute h-full w-full text-center flex items-center justify-center text-sm z-10 text-stone-100 left-0 top-0">
            400x300
          </p>
        </div>
        <img
          src="/leaves.jpg"
          className="z-20 w-32 shadow-xl h-auto rounded-md mt-10 -ml-4"
        />
      </>
    ),
  },
  {
    title: "Server workers",
    description: (
      <>
        Expose an HTTP API that mutates Jazz state. Or subscribe to Jazz state
        and update existing databases or third-party APIs.
      </>
    ),
    illustration: <ServerWorkersDiagram className="pt-8 w-auto" />,
  },
  {
    title: "Authentication",
    description: (
      <>
        Plug and play different kinds of auth like Passkeys (Touch ID, Face ID),
        and Clerk. Auth0, Okta, NextAuth coming soon.
      </>
    ),
    illustration: (
      <div className="flex gap-4 justify-center text-black dark:text-white">
        <Icon size="5xl" name="faceId" className="h-16 w-auto" />
        <ClerkLogo className="h-16 py-0.5 w-auto" />
        <Icon size="5xl" name="touchId" className="h-16 w-auto" />
      </div>
    ),
  },
];

export function FeaturesSection() {
  return (
    <div>
      <SectionHeader
        title="Everything else you need to ship quickly"
        slogan={
          <>
            <p>
              We take care of the groundwork that every app needs, so you can
              focus on building the cool stuff that makes your app unique.
            </p>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 lg:gap-8">
        {features.map(({ title, description, illustration }) => (
          <Card key={title} className="col-span-2 overflow-hidden">
            <div className="h-48 flex w-full items-center justify-center">
              {illustration}
            </div>
            <div className="p-4">
              <h3 className="font-medium text-stone-900 dark:text-white mb-1">
                {title}
              </h3>
              <Prose size="sm">{description}</Prose>
            </div>
          </Card>
        ))}

        <div className="relative border p-4 sm:p-8 shadow-sm rounded-xl col-span-2 sm:col-span-4 flex flex-col justify-end">
          <div className="mb-3 sm:-right-3 sm:bottom-30 sm:absolute sm:left-[40%] sm:top-2 md:top-4 md:left-[23%]">
            <img
              src="/api/latencyMap?spacing=2&dark=false"
              className="w-full dark:hidden"
            />
            <img
              src="/api/latencyMap?spacing=2&dark=true"
              className="w-full hidden dark:block"
            />
          </div>

          <H3>Jazz Cloud</H3>
          <div className="relative z-10 space-y-4">
            <Prose className="sm:max-w-[45%]" size="sm">
              <p>
                Jazz Cloud is real-time sync and storage infrastructure that
                scales your Jazz app up to millions of users.{" "}
                <strong>Instant setup, no config.</strong>
              </p>
            </Prose>
            <div className="flex items-center flex-wrap gap-3">
              <Button href="/cloud" variant="primary">
                View free tier & pricing
              </Button>

              <Prose size="sm">
                or{" "}
                <Link href="/docs/sync-and-storage#running-your-own">
                  self-host
                </Link>
                .
              </Prose>
            </div>
            <ul className="flex flex-col sm:flex-row gap-4 text-sm">
              {[
                "Data & blob storage",
                "Global sync",
                "No limits for public alpha",
              ].map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span className="text-blue p-1 rounded-full bg-blue-50 dark:text-blue-500 dark:bg-white/10">
                    <Icon name="check" size="xs" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
