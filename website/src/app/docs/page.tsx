// import { Prose } from "@/components/forMdx";
import { Link } from "@/components/ui/link";
import { getDocPosts } from "@/lib/mdx-utils";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "jazz - Docs",
  description: "Jazz Guide, FAQ & Docs.",
};

export default function Page() {
  const allDocs = getDocPosts();

  return (
    <>
      <section className="PageContainer container px-[64px] max-w-[clac(744px+250px)] space-y-w12">
        <Section title="Guides">
          {allDocs.map((doc) => (
            <Link
              key={doc.slug}
              href={`/docs/${doc.slug}`}
              className="flex flex-col gap-inset h-[240px] bg-accent-background rounded-lg"
            >
              <h2 className="Text-heading mt-auto p-w4 lg:w-11/12">
                {doc.metadata.title}
              </h2>
            </Link>
          ))}
        </Section>
        {/* <Section title="Recipes">
          {allDocs.map((doc) => (
            <Link
              key={doc.slug}
              href={`/docs/${doc.slug}`}
              className="flex flex-col gap-inset h-[240px] bg-accent-background rounded-lg"
            >
              <h2 className="Text-heading mt-auto p-w4 lg:w-11/12">
                {doc.metadata.title}
              </h2>
            </Link>
          ))}
        </Section> */}
        <Section title="API">
          {allDocs.map((doc) => (
            <Link
              key={doc.slug}
              href={`/docs/${doc.slug}`}
              className="flex flex-col gap-inset h-[240px] bg-accent-background rounded-lg"
            >
              <h2 className="Text-heading mt-auto p-w4 lg:w-11/12">
                {doc.metadata.title}
              </h2>
            </Link>
          ))}
        </Section>
      </section>

      {/* SPACER */}
      {/* <aside
        className={cn(
          "ArticleMap hidden min-[1320px]:block",
          "sticky top-under-nav-nudge w-[250px]",
          "h-max max-h-[calc(100vh-var(--space-under-nav-nudge))]",
        )}
      ></aside> */}
    </>
  );
}

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-w4">
    <div className="space-y-1.5">
      <h1 className="Text-subtitle">{title}</h1>
      <hr className="border-line" />
    </div>
    <div className="grid grid-cols-3 gap-w4">
      {children}
      <div className="flex flex-col gap-inset h-[240px] border rounded-lg">
        <h2 className="Text-heading !text-solid mt-auto p-w4">
          More coming soon…
        </h2>
      </div>
    </div>
  </div>
);
