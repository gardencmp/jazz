import { clsx } from "clsx";
import { Select } from "gcmp-design-system/src/app/components/molecules/Select";

export function FrameworkSelect({ className }: { className?: string }) {
  return (
    <Select label="Framework" className={clsx("label:sr-only", className)}>
      <option value="react">React</option>
      <option value="react-native">React Native</option>
      <option value="vue">Vue</option>
    </Select>
  );
}
