"use client";

import { clsx } from "clsx";
import { Select } from "gcmp-design-system/src/app/components/molecules/Select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function FrameworkSelect({ className }: { className?: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [framework, setFramework] = useState(
    searchParams.get("framework") || "react",
  );

  const path = usePathname();

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();

    const newParams = new URLSearchParams({ framework: e.target.value });
    const newFramework = e.target.value;

    setFramework(newFramework);

    newParams.set("framework", newFramework);
    router.push(`${path}?${newParams.toString()}`);
  };

  return (
    <Select
      label="Framework"
      value={framework}
      onChange={onChange}
      className={clsx("label:sr-only", className)}
    >
      <option value="react">React</option>
      <option value="react-native">React Native</option>
      <option value="vue">Vue</option>
    </Select>
  );
}
