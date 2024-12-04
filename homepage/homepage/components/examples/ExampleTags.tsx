import { Example } from "@/lib/example";

export function ExampleTags({ example }: { example: Example }) {
  const { tech, features } = example;

  return (
    <div className="flex gap-1">
      {tech?.map((tech) => (
        <p
          className="bg-green-50 border border-green-500 text-green-600 rounded-full py-0.5 px-2 text-xs dark:bg-green-800 dark:text-green-200 dark:border-green-700"
          key={tech}
        >
          {tech}
        </p>
      ))}
      {features?.map((feature) => (
        <p
          className="bg-pink-50 border border-pink-500 text-pink-600 rounded-full py-0.5 px-2 text-xs dark:bg-pink-800 dark:text-pink-200 dark:border-pink-700"
          key={feature}
        >
          {feature}
        </p>
      ))}
    </div>
  );
}
