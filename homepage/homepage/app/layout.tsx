import "./globals.css";
import type { Metadata } from "next";

import { Inter, Manrope } from "next/font/google";
import localFont from "next/font/local";

import { ThemeProvider } from "@/components/ThemeProvider";
import { JazzFooter } from "@/components/footer";
import { JazzNav } from "@/components/nav";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// If loading a variable font, you don't need to specify the font weight
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const commitMono = localFont({
  src: [
    {
      path: "../../design-system/fonts/CommitMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../design-system/fonts/CommitMono-Regular.woff",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-commit-mono",
  display: "swap",
});

const metaTags = {
  title: "Jazz - Build local-first apps",
  description:
    "Jazz is an open-source framework for building local-first apps, removing 90% of the backend and infrastructure complexity.",
  url: "https://jazz.tools",
};

export const metadata: Metadata = {
  // metadataBase is a convenience option to set a base URL prefix for metadata fields that require a fully qualified URL.
  metadataBase: new URL(metaTags.url),
  title: {
    template: "%s | Jazz",
    default: metaTags.title,
  },
  applicationName: "Jazz",
  description: metaTags.description,
  openGraph: {
    title: metaTags.title,
    description: metaTags.description,
    url: metaTags.url,
    siteName: "Jazz",
    images: [
      {
        url: "/social-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={[
          manrope.variable,
          commitMono.variable,
          inter.className,
          "min-h-full flex flex-col items-center [&_*]:scroll-mt-[5rem]",
          "bg-white text-stone-700 dark:text-stone-400 dark:bg-stone-950",
        ].join(" ")}
      >
        <SpeedInsights />
        <Analytics />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex-1 w-full">
            <JazzNav />
            <main>{children}</main>
          </div>
          <JazzFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
