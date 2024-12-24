"use client";

import { Framework, frameworkNames, frameworks } from "@/lib/framework";
import { useFramework } from "@/lib/use-framework";
import { clsx } from "clsx";
import { Select } from "gcmp-design-system/src/app/components/molecules/Select";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export function FrameworkSelect({ className }: { className?: string }) {
  const router = useRouter();
  const defaultFramework = useFramework();
  const [framework, setFramework] = useState(defaultFramework);

  const path = usePathname();

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();

    const newFramework = e.target.value as Framework;
    setFramework(newFramework);

    router.push(path.replace(defaultFramework, newFramework));
  };

  return (
    <Select
      label="Framework"
      value={framework}
      onChange={onChange}
      className={clsx("max-w-96 label:sr-only", className)}
    >
      {frameworks.map((framework) => (
        <option key={framework} value={framework}>
          {frameworkNames[framework]}
        </option>
      ))}
    </Select>
  );
}
