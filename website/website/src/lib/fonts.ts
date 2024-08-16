import localFont from "next/font/local";
import { Inter } from "next/font/google";

/* SEE: https://nextjs.org/docs/basic-features/font-optimization */

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = localFont({
  variable: "--font-display",
  src: [
    {
      // path: "../../public/fonts/SaansTRIAL-Light.woff2",
      // path: "../../public/fonts/Basier-Square-Regular.otf",
      // path: "../../public/fonts/Regola-Pro-Regular.otf",
      // path: "../../public/fonts/HeroNew-Regular.otf",
      path: "../../public/fonts/Scto-Grotesk-A-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      // path: "../../public/fonts/SaansTRIAL-Regular.woff2",
      // path: "../../public/fonts/Basier-Square-Regular.otf",
      // path: "../../public/fonts/Regola-Pro-Regular.otf",
      // path: "../../public/fonts/HeroNew-Regular.otf",
      path: "../../public/fonts/Scto-Grotesk-A-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      // path: "../../public/fonts/SaansTRIAL-Medium.woff2",
      // path: "../../public/fonts/Basier-Square-Medium.otf",
      // path: "../../public/fonts/Regola-Pro-Medium.otf",
      // path: "../../public/fonts/HeroNew-Medium.otf",
      path: "../../public/fonts/Scto-Grotesk-A-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      // path: "../../public/fonts/SaansTRIAL-SemiBold.woff2",
      // path: "../../public/fonts/Basier-Square-SemiBold.otf",
      // path: "../../public/fonts/Regola-Pro-Medium.otf",
      // path: "../../public/fonts/HeroNew-SemiBold.otf",
      path: "../../public/fonts/Scto-Grotesk-A-Medium.woff2",
      weight: "600",
      style: "normal",
    },
    {
      // path: "../../public/fonts/SaansTRIAL-Bold.woff2",
      // path: "../../public/fonts/Basier-Square-Bold.otf",
      // path: "../../public/fonts/Regola-Pro-Bold.otf",
      // path: "../../public/fonts/HeroNew-Bold.otf",
      path: "../../public/fonts/Scto-Grotesk-A-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      // path: "../../public/fonts/SaansTRIAL-Heavy.woff2",
      // path: "../../public/fonts/Basier-Square-Bold.otf",
      // path: "../../public/fonts/Regola-Pro-Bold.otf",
      // path: "../../public/fonts/HeroNew-ExtraBold.otf",
      path: "../../public/fonts/Scto-Grotesk-A-Black.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  display: "swap",
});

const mono = localFont({
  variable: "--font-mono",
  src: [
    {
      // path: "../../public/fonts/ppr_0829.woff2",
      path: "../../public/fonts/SohneMono-Buch.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  display: "swap",
});

export { sans, mono, display };
