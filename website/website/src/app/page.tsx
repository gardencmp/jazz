import { getMdxData } from "@/lib/mdx-server-utils";
import {
  CovaluesSection,
  HeroCards2,
  MeshSection,
  ToolkitSection,
} from "./(home)/components";

const contentDir = "src/app/(home)/content";

export default function HomePage() {
  const content = getMdxData(contentDir);
  // console.log(content);
  const covaluesContent = content.filter((item) =>
    item.slug.includes("covalues"),
  );
  const toolkitContent = content.filter((item) =>
    item.slug.includes("toolkit"),
  );

  return (
    <>
      <section className="container max-w-docs space-y-w12 pb-w24 pt-under-nav-content">
        <header className="grid grid-cols-12 gap-w6">
          <div className="col-span-full ml-[-0.2em]">
            {/* <PixelarticonsFileAlt className="text-[2em] text-accent-fill transform translate-y-[-1px]" /> */}
            {/* !text-accent-fill */}
            <h1 className="Text-super text-accent-fill">Instant sync.</h1>
            {/* text-solid? */}
            <h2 className="Text-super text-fill-contrast text-balance">
              Jazz is a new way to build apps with distributed state.
            </h2>
            {/* <h1 className="Text-super text-accent-fill">
              Instant sync.{" "}
              <span className="text-solid">
                Jazz is a new way to build apps with distributed state.
              </span>
            </h1> */}
          </div>
          <div className="space-y-2 col-span-full lg:col-span-11">
            <p className="text-subheading text-fill text-balance">
              Jazz is an open-source toolkit that replaces APIs, databases and
              message queues with a single new abstraction—“Collaborative
              Values”—distributed state with secure permissions built-in.
              <span className="font-medium text-fill-contrast lg:table">
                Features that used to take months now work out of the box.
                {/* …now work out-of-the-box. */}
              </span>
            </p>
            {/* <p className="text-large text-fill">
              Features that used to take months now work out-of-the-box.
              <span className="font-medium text-fill-contrast lg:table">
                Hard things are easy now.
              </span>
            </p> */}
          </div>
        </header>
        <HeroCards2 />
      </section>

      {/* <hr className="border-guide-dark" /> */}
      {/* bg-cov-background-subtle is too yellowy */}
      {/* bg-background-subtle */}
      <section className="bg-background">
        <div className="container max-w-docs space-y-w8 pt-w12 pb-w16">
          <CovaluesSection contentItems={covaluesContent} />
        </div>
      </section>
      <hr className="border-guide-dark" />
      <section className="bg-background">
        <div className="container max-w-docs space-y-w8 pt-w12 pb-w16">
          <ToolkitSection contentItems={toolkitContent} />
        </div>
      </section>
      <hr className="border-guide-dark" />
      <section className="bg-background">
        <div className="container max-w-docs space-y-w8 pt-w12 pb-w16">
          <MeshSection />
        </div>
      </section>
    </>
  );
}
