import { MainNav } from "@/components/nav";
import { display, mono, sans, manrope } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import "@/styles/globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import { Footer } from "@/components/nav/footer";

export const metadata: Metadata = {
  title: "jazz - Instant sync",
  description: "Go beyond request/response - ship modern apps with sync.",
};

// https://nextjs.org/docs/app/api-reference/functions/generate-viewport
export const viewport: Viewport = {
  // Indicating multiple color schemes indicates that the first scheme is preferred by the document, and the second specified scheme is acceptable if the user prefers it. https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta/name
  colorScheme: "light dark",
  // customize the surrounding browser chrome UI, see: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta/name/theme-color
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en">
      <body
        className={cn(
          sans.variable,
          display.variable,
          mono.variable,
          manrope.variable,
        )}
      >
        <Providers>
          <MainNav />
          <main className="min-h-screen pt-[calc(2.5*var(--space-inset))]">
            {children}
          </main>
          <Footer />
        </Providers>
        <SpeedInsights />
        <Analytics mode="production" />
      </body>
    </html>
  );
}
