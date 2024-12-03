import { Prose } from "@components/molecules/Prose";
import { NewsletterForm } from "@components/organisms/NewsletterForm";

export default function Home() {
  return (
    <main className="container flex flex-col gap-8 py-8 lg:py-16">
      <h1 className="text-2xl font-semibold font-display">
        Jazz Design System
      </h1>

      <h2>Typography (Prose)</h2>

      <div className="grid gap-4">
        <div>
          Heading 1
          <Prose className="p-3 border">
            <h1>Ship top-tier apps at high tempo</h1>
          </Prose>
        </div>
        <div>
          Heading 2
          <Prose className="p-3 border">
            <h2>Ship top-tier apps at high tempo</h2>
          </Prose>
        </div>
        <div>
          Heading 3
          <Prose className="p-3 border">
            <h3>Ship top-tier apps at high tempo</h3>
          </Prose>
        </div>
        <div>
          Heading 4
          <Prose className="p-3 border">
            <h4>Ship top-tier apps at high tempo</h4>
          </Prose>
        </div>
        <div>
          Paragraph
          <Prose className="p-3 border">
            <p>
              <strong>Jazz is a framework for building local-first apps</strong>{" "}
              — an architecture that lets companies like Figma and Linear play
              in a league of their own.
            </p>

            <p>
              Open source. Self-host or use Jazz Cloud for zero-config magic.
            </p>
          </Prose>
        </div>

        <div>
          Link
          <Prose className="p-3 border">
            This is a <a href="https://jazz.tools">link</a>
          </Prose>
        </div>

        <div>
          Code
          <Prose className="p-3 border">
            This is a one-line <code>piece of code</code>
          </Prose>
        </div>
      </div>

      <h2>Newsletter Subscription Form</h2>

      <div className="p-3 border">
        <NewsletterForm />
      </div>
    </main>
  );
}
