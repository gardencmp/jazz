"use client";

import { FrameworkContext } from "@/context/FrameworkContext";
import { clsx } from "clsx";
import { Select } from "gcmp-design-system/src/app/components/molecules/Select";
import { usePathname, useRouter } from "next/navigation";
import { useContext, useState } from "react";

export function FrameworkSelect({ className }: { className?: string }) {
  const router = useRouter();

  const defaultFramework = useContext(FrameworkContext);

  const [framework, setFramework] = useState(defaultFramework);

  const path = usePathname();

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();

    const newFramework = e.target.value;
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
