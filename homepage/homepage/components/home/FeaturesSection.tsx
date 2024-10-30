import {H2, H3, Kicker} from "gcmp-design-system/src/app/components/atoms/Headings";
import {Prose} from "gcmp-design-system/src/app/components/molecules/Prose";
import {GappedGrid} from "gcmp-design-system/src/app/components/molecules/GappedGrid";
import {CheckIcon, FileLock2Icon, ImageIcon, KeyRoundIcon, UploadCloudIcon, UserIcon} from "lucide-react";
import {LabelledFeatureIcon} from "gcmp-design-system/src/app/components/molecules/LabelledFeatureIcon";
import {Button} from "gcmp-design-system/src/app/components/atoms/Button";
import {ComingSoonBadge} from "gcmp-design-system/src/app/components/atoms/ComingSoonBadge";
import {clsx} from "clsx";

export function FeaturesSection() {
  const features  = [
    {
      title: "File uploads",
      icon: UploadCloudIcon,
      description: <>
        <p>Just use <code>{`<input type="file"/>`}</code>, and
        easily convert from and to Browser <code>Blobs</code>{" "}
        using a <code>BinaryCoStream</code> CoValue.</p>
      </>,
      className: "rounded-r-none rounded-b-none",
    },
    {
      title: "Progressive image loading",
      icon: ImageIcon,
      description: <>
        Using Jazz&apos;s <code>ImageDefinition</code> component, you get
        progressive image loading, super fast blur preview, and image size info.
      </>,
      className: "rounded-none",
    },


    {
      title: "E2E encryption",
      icon: KeyRoundIcon,
      description: (
        <>
          <p>
            All data is end-to-end encrypted and cryptographically
            signed by default, so it can&apos;t be tampered with.
          </p>
        </>
      ),
      className: "rounded-l-none rounded-b-none"
    },
    {
      title: "Authentication",
      icon: UserIcon,
      description: (
        <>
          <p>Plug and play different kinds of auth.</p>
          <ul className="pl-4 list-disc">
            <li>WebAuthN (TouchID/FaceID)</li>
            <li>Clerk</li>
            <li>
              Auth0, Okta, NextAuth <ComingSoonBadge />
            </li>
          </ul>
        </>
      ),
      className: "rounded-t-none rounded-r-none"
    },
  ]

  return (

    <div className="flex flex-col gap-4 md:gap-6">
      <H2>Everything else you need to ship quickly</H2>

      <Prose size="lg">
        <p>
          We take care of the groundwork that every app needs, so you can focus on
          building the cool stuff that makes your app unique.
        </p>
      </Prose>

      <GappedGrid>

        {features.map(
          ({title, icon: Icon, description, className = ''}) => (
            <LabelledFeatureIcon
              className={clsx(className, "col-span-2")}
              key={title}
              label={title}
              icon={Icon}
              explanation={description}
            />
          ),
        )}

        <div className="border p-4 shadow-sm rounded-br-xl col-span-4 space-y-4">
          <H3>Jazz Cloud</H3>
          <Prose>
            <p>
              Jazz Cloud is a real-time sync and storage
              infrastructure that scales your Jazz app up to millions
              of users. It gives you secure collaborative data on a
              global scale from day one.{" "}
              <strong>Easy setup, no configuration needed.</strong>
            </p>
          </Prose>
          <div>
            <Button href="/cloud" variant="primary">
              Get started for free
            </Button>
          </div>
        </div>
      </GappedGrid>
    </div>
  );
}
