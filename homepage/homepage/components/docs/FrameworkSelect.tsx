"use client";

import { Framework, useFramework } from "@/lib/framework";
import { clsx } from "clsx";
import { Select } from "gcmp-design-system/src/app/components/molecules/Select";
import { usePathname, useRouter } from "next/navigation";
import { useContext, useState } from "react";

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
      className={clsx("label:sr-only", className)}
    >
      <option value="react">React</option>
      <option value="react-native">React Native</option>
      <option value="vue">Vue</option>
    </Select>
  );
}
