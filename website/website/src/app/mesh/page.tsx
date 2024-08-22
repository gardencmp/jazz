import { Card, CardHeading } from "@/components/card";
import { SectionHeadingSecondary } from "@/components/layout";
import { getMdxData } from "@/lib/mdx-server-utils";
import { CylinderIcon, DatabaseBackupIcon, RouteIcon } from "lucide-react";
import {
  CustomSection,
  EnterpriseSection,
  FaqSection,
  PricingSection,
} from "./components";

const contentDir = "src/app/mesh/content";

export default async function MeshPage() {
  const content = await getMdxData(contentDir);
  const customContent = content.filter((item) => item.slug.includes("custom"));

  return (
    <>
      <section className="container max-w-docs space-y-w12 pb-w24 pt-under-nav-content">
        <header className="grid grid-cols-12 gap-w6">
          <div className="col-span-full lg:col-span-9 ml-[-0.2em]">
            <h1 className="Text-super text-accent-fill">
              Sync & Storage Mesh.
            </h1>
            <h2 className="Text-super text-fill-contrast text-balance">
              The first Collaboration Delivery Network.
            </h2>
          </div>
          <p className="col-span-full lg:col-span-8 text-large text-fill text-balance">
            Real-time sync and storage infrastructure that scales up to millions
            of users.
            <span className="font-medium text-fill-contrast lg:table">
              Pricing that scales down to zero.
            </span>
          </p>
        </header>

        <div className="grid grid-cols-12 gap-w4">
          <Card>
            <CardHeading Icon={<RouteIcon />} iconSize="large">
              Optional Mesh Routing
            </CardHeading>
            <div className="prose text-fill-contrast">
              Get ultra-low latency between any group of users with our
              decentralized mesh interconnect.
            </div>
          </Card>
          <Card>
            <CardHeading Icon={<DatabaseBackupIcon />} iconSize="large">
              Smart caching
            </CardHeading>
            <div className="prose text-fill-contrast">
              Give users instant load times, with their latest data state always
              cached close to them.
            </div>
          </Card>
          <Card>
            <CardHeading Icon={<CylinderIcon />} iconSize="large">
              Storage
            </CardHeading>
            <div className="prose text-fill-contrast">
              Store files and media streams as idiomatic CoValues without S3.
            </div>
          </Card>
        </div>
      </section>

      {/* <hr className="border-guide-dark" /> */}
      <section className="bg-background pt-w12 pb-w16">
        <div className="container max-w-docs space-y-w8">
          <div className="space-y-w8">
            <SectionHeadingSecondary>Pricing</SectionHeadingSecondary>
            <PricingSection />
          </div>
          <div className="">
            <FaqSection />
          </div>
        </div>
      </section>

      {/* TODO: GLOBAL */}

      <hr className="border-guide-dark" />
      <section className="bg-background pt-w12 pb-w16 mt-[0px]">
        <div className="container max-w-docs">
          <EnterpriseSection />
        </div>
      </section>
      <hr className="border-guide-dark" />
      <section className="bg-background pt-w12 pb-w16">
        <div className="container max-w-docs space-y-w8">
          <CustomSection contentItems={customContent} />
        </div>
      </section>
    </>
  );
}
