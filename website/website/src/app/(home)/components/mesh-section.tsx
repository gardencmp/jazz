import { PackagesSection } from "@/components/layout";

export const MeshSection = () => (
  <>
    <PackagesSection
      theme="mesh"
      heading="The Jazz Mesh"
      subheading="Serverless sync & storage for Jazz apps."
      link="/mesh"
      linkLabel="Learn more"
      description={
        <>
          <p className="">
            To give you sync and secure collaborative data instantly on a global
            scale, we&rsquo;re running Jazz Mesh. It works with any Jazz-based
            app, requires no setup and has straightforward, scale-to-zero
            pricing.
          </p>
          <p className="">
            Jazz Mesh is currently free — and it&rsquo;s set up as the default
            sync & storage peer in Jazz, letting you start building multi-user
            apps with persistence right away, no backend needed.
          </p>
        </>
      }
    ></PackagesSection>
  </>
);
