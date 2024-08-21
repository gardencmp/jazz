import {
  RiDashboardHorizontalFill,
  RiArchiveDrawerLine,
  RiBookmarkFill,
} from "@/components/icons";
import {
  FileLock2Icon,
  GaugeIcon,
  HardDriveDownloadIcon,
  KeyRoundIcon,
  MonitorSmartphoneIcon,
  PlaneIcon,
  UploadCloudIcon,
  UsersIcon,
  MousePointerClick,
  BoxIcon,
  LayoutDashboardIcon,
} from "lucide-react";
import { Theme } from "@/components/theme";
import clsx from "clsx";

export const ThemeIcon = ({
  theme = "toolkit",
  className,
}: {
  theme?: Theme;
  className?: string;
}) => {
  const IconComponent = {
    default: MousePointerClick,
    toolkit: BoxIcon,
    // covalues: RiArchiveDrawerLine,
    covalues: LayoutDashboardIcon,
    mesh: RiBookmarkFill,
  }[theme];

  return <IconComponent className={clsx("shrink-0 size-em", className)} />;
};
