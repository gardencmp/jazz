import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/themeProvider";

import { Inter, Manrope } from "next/font/google";
import localFont from "next/font/local";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { JazzNav } from "@/components/nav";
import { JazzFooter } from "@/components/footer";

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

export const metadata: Metadata = {
    title: "jazz - Instant sync",
    description: "Go beyond request/response - ship modern apps with sync.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body
                className={[
                    manrope.variable,
                    commitMono.variable,
                    inter.className,
                    "flex flex-col items-center bg-stone-50 dark:bg-stone-950",
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
                    <JazzNav />
                    <main className="flex min-h-screen flex-col container w-full">
                        {children}
                    </main>
                    <JazzFooter />
                </ThemeProvider>
            </body>
        </html>
    );
}
