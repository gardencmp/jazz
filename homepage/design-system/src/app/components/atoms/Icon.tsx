import {
  ArrowDownIcon,
  ArrowRightIcon,
  BookTextIcon,
  BoxIcon,
  CheckIcon,
  ChevronDown,
  ChevronRight,
  CodeIcon,
  CopyIcon,
  FileLock2Icon,
  FileTextIcon,
  FingerprintIcon,
  FolderArchiveIcon,
  GaugeIcon,
  GlobeIcon,
  ImageIcon,
  LinkIcon,
  LockKeyholeIcon,
  LucideIcon,
  MailIcon,
  MenuIcon,
  MessageCircleQuestionIcon,
  MonitorSmartphoneIcon,
  MoonIcon,
  MousePointerSquareDashedIcon,
  PencilLineIcon,
  ScanFace,
  ScrollIcon,
  SunIcon,
  TrashIcon,
  UploadCloudIcon,
  UserIcon,
  UserPlusIcon,
  UsersIcon,
  WifiOffIcon,
  XIcon,
} from "lucide-react";

const icons = {
  addUser: UserPlusIcon,
  arrowDown: ArrowDownIcon,
  arrowRight: ArrowRightIcon,
  auth: UserIcon,
  browser: GlobeIcon,
  check: CheckIcon,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  close: XIcon,
  code: CodeIcon,
  copy: CopyIcon,
  darkTheme: MoonIcon,
  delete: TrashIcon,
  devices: MonitorSmartphoneIcon,
  docs: BookTextIcon,
  encryption: LockKeyholeIcon,
  faceId: ScanFace,
  file: FileTextIcon,
  help: MessageCircleQuestionIcon,
  image: ImageIcon,
  instant: GaugeIcon,
  lightTheme: SunIcon,
  link: LinkIcon,
  menu: MenuIcon,
  newsletter: MailIcon,
  offline: WifiOffIcon,
  package: BoxIcon,
  permissions: FileLock2Icon,
  social: UsersIcon,
  spatialPresence: MousePointerSquareDashedIcon,
  tableOfContents: ScrollIcon,
  touchId: FingerprintIcon,
  upload: UploadCloudIcon,
  write: PencilLineIcon,
  zip: FolderArchiveIcon,
};

// copied from tailwind line height https://tailwindcss.com/docs/font-size
const sizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 28,
  "2xl": 32,
  "3xl": 36,
  "4xl": 40,
  "5xl": 48,
  "6xl": 60,
  "7xl": 72,
  "8xl": 96,
  "9xl": 128,
};

const strokeWidths = {
  xs: 2,
  sm: 2,
  md: 1.5,
  lg: 1.5,
  xl: 1.5,
  "2xl": 1.25,
  "3xl": 1.25,
  "4xl": 1.25,
  "5xl": 1,
  "6xl": 1,
  "7xl": 1,
  "8xl": 1,
  "9xl": 1,
};

export function Icon({
  name,
  icon,
  size = "md",
  className,
  ...svgProps
}: {
  name?: string;
  icon?: LucideIcon;
  size?: keyof typeof sizes;
  className?: string;
} & React.SVGProps<SVGSVGElement>) {
  if (!icon && (!name || !icons.hasOwnProperty(name))) {
    throw new Error(`Icon not found`);
  }

  // @ts-ignore
  const IconComponent = icons?.hasOwnProperty(name) ? icons[name] : icon;

  return (
    <IconComponent
      aria-hidden="true"
      size={sizes[size]}
      strokeWidth={strokeWidths[size]}
      strokeLinecap="butt"
      className={className}
      {...svgProps}
    />
  );
}
