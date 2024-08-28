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
} from "lucide-react";

export const features = [
  {
    Icon: MonitorSmartphoneIcon,
    label: "Cross-device sync",
  },
  {
    Icon: MousePointerClick,
    label: "Real-time multiplayer",
  },
  {
    Icon: UsersIcon,
    label: "Team/social features",
  },
  {
    Icon: FileLock2Icon,
    label: "Built-in permissions",
  },
  // {
  //   Icon: FileLock2Icon,
  //   label: "CUSTOM",
  // },
  {
    Icon: UploadCloudIcon,
    label: "Cloud sync & storage",
  },
  {
    Icon: HardDriveDownloadIcon,
    label: "On-device storage",
  },
  {
    Icon: GaugeIcon,
    label: "Instant UI updates",
  },
  {
    Icon: KeyRoundIcon,
    label: "E2EE & signatures",
  },
];
