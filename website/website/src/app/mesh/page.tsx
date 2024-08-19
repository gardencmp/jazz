import Image from "next/image";
import clsx from "clsx";
import {
  WorkflowIcon,
  UploadCloudIcon,
  PlaneIcon,
  MonitorSmartphoneIcon,
  GaugeIcon,
  UsersIcon,
  FileLock2Icon,
  HardDriveDownloadIcon,
  KeyRoundIcon,
} from "lucide-react";
import HomeContent from "./(home)/content/home.mdx";
import { CustomMDX } from "@/components/mdx";
import { CardMetaHeading, APICard } from "@/components/card";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import { parseFrontmatter } from "@/lib/mdx-utils";
import fs from "fs/promises";
import path from "path";
import {
  RiRouteLine,
  RiArrowGoBackFill,
  RiArchiveDrawerLine,
} from "@/components/icons";

async function getHomeContent() {
  const dataStructuresPath = path.join(
    process.cwd(),
    "src/app/(home)/content/covalues-datastructures.mdx",
  );
  const filesPath = path.join(
    process.cwd(),
    "src/app/(home)/content/covalues-files.mdx",
  );
  const permsPath = path.join(
    process.cwd(),
    "src/app/(home)/content/covalues-perms.mdx",
  );

  const [source1, source2, source3] = await Promise.all([
    fs.readFile(dataStructuresPath, "utf8"),
    fs.readFile(filesPath, "utf8"),
    fs.readFile(permsPath, "utf8"),
  ]);

  const dataStructures = parseFrontmatter(source1);
  const files = parseFrontmatter(source2);
  const perms = parseFrontmatter(source3);

  return { dataStructures, files, perms };
}

export default async function MeshPage() {
  const { dataStructures, files, perms } = await getHomeContent();

  return (
    <div className="relative space-y-w24">
      <section className="container max-w-docs space-y-w12">
        <header className="grid grid-cols-12 gap-w6">
          <div className="col-span-full lg:col-span-9 ml-[-0.2em]">
            <h1 className="Text-super text-accent-fill">
              Sync & Storage Mesh.
            </h1>
            <h2 className="Text-super text-solid">
              The first Collaboration Delivery Network.
            </h2>
          </div>
          <p
            className={clsx("col-span-full lg:col-span-8 text-large text-fill")}
          >
            Real-time sync and storage infrastructure that scales up to millions
            of users.
            <span className="font-medium text-fill-contrast lg:table">
              Pricing that scales down to zero.
            </span>
          </p>
        </header>
        <div className="grid grid-cols-12 gap-w4">
          <APICard>
            <CardMetaHeading icon={RiRouteLine} iconSize="large">
              Optional Mesh Routing
            </CardMetaHeading>
            <div className="prose code-simple">
              Get ultra-low latency between any group of users with our
              decentralized mesh interconnect.
            </div>
          </APICard>
          <APICard>
            <CardMetaHeading icon={RiArrowGoBackFill} iconSize="large">
              Smart caching
            </CardMetaHeading>
            <div className="prose code-simple">
              Give users instant load times, with their latest data state always
              cached close to them.
            </div>
          </APICard>
          <APICard>
            <CardMetaHeading icon={RiArchiveDrawerLine} iconSize="large">
              Blob storage & media streaming
            </CardMetaHeading>
            <div className="prose code-simple">
              Store files and media streams as idiomatic CoValues without S3.
            </div>
          </APICard>
        </div>
      </section>
    </div>
  );
}
