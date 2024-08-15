import clsx from "clsx";
import { SolarCloudUploadBoldDuotone } from "@/components/icons";

const themeIcons = {
  success: SolarCloudUploadBoldDuotone,
  warning: SolarCloudUploadBoldDuotone,
  error: SolarCloudUploadBoldDuotone,
  notice: SolarCloudUploadBoldDuotone,
};

interface AlertProps extends React.HTMLAttributes<HTMLElement> {
  children: string;
  theme?: keyof typeof themeIcons;
}

export function Alert({ children, theme = "notice", ...props }: AlertProps) {
  const IconComponent = themeIcons[theme];

  return (
    <div
      className={clsx(
        // match .prose pre
        "rounded-lg bg-notice-background px-w4 py-2.5 !my-w6",
        "flex gap-3",
      )}
      {...props}
    >
      <div className="shrink-0">
        <IconComponent className={`text-${theme}-foreground size-em`} />
      </div>
      {children}
    </div>
  );
}
