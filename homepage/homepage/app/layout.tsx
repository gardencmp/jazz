import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/themeProvider";

import { Manrope } from "next/font/google";
import { Inter } from "next/font/google";
import localFont from "next/font/local";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { JazzNav } from "@/components/docs/nav";
import { JazzFooter } from "@/components/docs/footer";

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
const pragmata = localFont({
    src: "../node_modules/gcmp-design-system/fonts/ppr_0829.woff2",
    variable: "--font-ppr",
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
                    pragmata.variable,
                    inter.className,
                    "flex flex-col items-center overflow-x-hidden",
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
                    <main className="flex min-h-screen flex-col p-8 max-w-[80rem] w-full [&_*]:scroll-mt-[6rem]">
                        {children}
                    </main>
                    <JazzFooter />
                </ThemeProvider>
            </body>
        </html>
    );
}
