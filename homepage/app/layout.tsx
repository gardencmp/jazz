import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/themeProvider";

import { Manrope } from "next/font/google";
import { Inter } from "next/font/google";
import localFont from "next/font/local";

import { GcmpLogo, JazzLogo } from "@/components/logos";
import { SiGithub, SiDiscord, SiTwitter } from "@icons-pack/react-simple-icons";
import { Nav, NavLink, Newsletter, NewsletterButton } from "@/components/nav";
import { MailIcon } from "lucide-react";

// If loading a variable font, you don't need to specify the font weight
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const pragmata = localFont({
    src: "../fonts/ppr_0829.woff2",
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
                    "flex flex-col items-center bg-stone-50 dark:bg-stone-950 overflow-x-hidden",
                ].join(" ")}
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <Nav
                        mainLogo={<JazzLogo className="w-24" />}
                        items={[
                            { title: "Toolkit", href: "/" },
                            { title: "Global Mesh", href: "/mesh" },
                            {
                                title: "Docs & Guides",
                                href: "https://github.com/gardencmp/jazz/blob/main/DOCS.md",
                                newTab: true,
                            },
                            {
                                title: "Blog",
                                href: "https://gcmp.io/news",
                                firstOnRight: true,
                                newTab: true,
                            },
                            {
                                title: "Releases",
                                href: "https://github.com/gardencmp/jazz/releases",
                                newTab: true,
                            },
                            {
                                title: "Roadmap",
                                href: "https://github.com/orgs/gardencmp/projects/4/views/3",
                                newTab: true,
                            },
                            {
                                title: "GitHub",
                                href: "https://github.com/gardencmp/jazz",
                                newTab: true,
                                icon: <SiGithub className="w-5" />,
                            },
                            {
                                title: "Discord",
                                href: "https://discord.gg/utDMjHYg42",
                                newTab: true,
                                icon: <SiDiscord className="w-5" />,
                            },
                            {
                                title: "X",
                                href: "https://x.com/jazz_tools",
                                newTab: true,
                                icon: <SiTwitter className="w-5" />,
                            },
                        ]}
                    />
                    <main className="flex min-h-screen flex-col p-8 max-w-[80rem] w-full">
                        <article
                            className={[
                                "pt-20",
                                "prose lg:prose-lg max-w-none prose-stone dark:prose-invert",
                                "prose-headings:font-display",
                                "prose-h1:text-5xl lg:prose-h1:text-6xl prose-h1:font-medium prose-h1:tracking-tighter",
                                "prose-h2:text-2xl lg:prose-h2:text-3xl prose-h2:font-medium prose-h2:tracking-tight",
                                "prose-p:max-w-3xl prose-p:leading-snug",
                                "prose-strong:font-medium",
                                "prose-code:font-normal prose-code:leading-tight prose-code:before:content-none prose-code:after:content-none prose-code:bg-stone-100 prose-code:dark:bg-stone-900 prose-code:p-1 prose-code:-my-1 prose-code:rounded",
                            ].join(" ")}
                        >
                            {children}
                        </article>
                    </main>
                    <footer className="flex mt-10 min-h-[15rem] -mb-20 bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 w-full justify-center">
                        <div className="p-8 max-w-[80rem] w-full grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-8 max-sm:mb-12">
                            <div className="col-span-full md:col-span-1 sm:row-start-4 md:row-start-auto lg:col-span-2 md:row-span-2 md:flex-1 flex flex-row md:flex-col max-sm:mt-4 justify-between max-sm:items-start gap-2 text-sm min-w-[10rem]">
                                <GcmpLogo monochrome className="w-32" />
                                <p className="max-sm:text-right">
                                    © 2023
                                    <br />
                                    Garden Computing, Inc.
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 text-sm">
                                <h1 className="font-medium">Resources</h1>
                                <NavLink
                                    className="py-0.5 max-sm:px-0 md:px-0 lg:px-0"
                                    href="/"
                                >
                                    Toolkit
                                </NavLink>
                                <NavLink
                                    className="py-0.5 max-sm:px-0 md:px-0 lg:px-0"
                                    href="/mesh"
                                >
                                    Global Mesh
                                </NavLink>
                                <NavLink
                                    className="py-0.5 max-sm:px-0 md:px-0 lg:px-0"
                                    href="https://github.com/gardencmp/jazz/blob/main/DOCS.md"
                                    newTab
                                >
                                    Docs & Guides
                                </NavLink>
                            </div>
                            {/* <div className="flex flex-col gap-2 text-sm">
                                <h1 className="font-medium">Legal</h1>
                            </div> */}
                            <div className="flex flex-col gap-2 text-sm">
                                <h1 className="font-medium">Community</h1>
                                <NavLink
                                    className="py-0.5 max-sm:px-0 md:px-0 lg:px-0"
                                    href="https://github.com/gardencmp/jazz"
                                    newTab
                                >
                                    GitHub
                                </NavLink>
                                <NavLink
                                    className="py-0.5 max-sm:px-0 md:px-0 lg:px-0"
                                    href="https://discord.gg/utDMjHYg42"
                                    newTab
                                >
                                    Discord
                                </NavLink>
                                <NavLink
                                    className="py-0.5 max-sm:px-0 md:px-0 lg:px-0"
                                    href="https://x.com/jazz_tools"
                                    newTab
                                >
                                    Twitter
                                </NavLink>
                            </div>
                            <div className="flex flex-col gap-2 text-sm">
                                <h1 className="font-medium">News</h1>
                                <NavLink
                                    className="py-0.5 max-sm:px-0 md:px-0 lg:px-0"
                                    href="https://gcmp.io/news"
                                    newTab
                                >
                                    Blog
                                </NavLink>
                                <NavLink
                                    className="py-0.5 max-sm:px-0 md:px-0 lg:px-0"
                                    href="https://github.com/gardencmp/jazz/releases"
                                    newTab
                                >
                                    Releases
                                </NavLink>
                                <NavLink
                                    className="py-0.5 max-sm:px-0 md:px-0 lg:px-0"
                                    href="https://github.com/orgs/gardencmp/projects/4/views/3"
                                    newTab
                                >
                                    Roadmap
                                </NavLink>
                            </div>
                            <div className="col-span-3 md:col-start-2 lg:col-start-auto flex flex-col gap-2 text-sm">
                                Sign up for updates:


                                <Newsletter/>
                            </div>
                        </div>
                    </footer>
                </ThemeProvider>
                <script defer data-api="/api/event" data-domain="jazz.tools" src="/js/script.js"></script>
            </body>
        </html>
    );
}
