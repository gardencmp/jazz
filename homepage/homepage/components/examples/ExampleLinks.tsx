import { Example } from "@/lib/example";
import { Button } from "gcmp-design-system/src/app/components/atoms/Button";

export function ExampleLinks({ example }: { example: Example }) {
  const { slug, demoUrl } = example;
  const githubUrl = `https://github.com/gardencmp/jazz/tree/main/examples/${slug}`;

  return (
    <div className="flex gap-2">
      <Button href={githubUrl} newTab variant="secondary" size="sm">
        View code
      </Button>

      {demoUrl && (
        <Button href={demoUrl} newTab variant="secondary" size="sm">
          View demo
        </Button>
      )}
    </div>
  );
}
