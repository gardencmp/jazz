import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { JazzAndAuth } from "@/components/JazzAndAuth";
import { Nav } from "@/components/Nav";
import clsx from "clsx";
import { Fraunces } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Jazz Book Shelf",
  description: "Jazz Book Shelf",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={clsx(inter.className, fraunces.variable)}>
        <JazzAndAuth>
          <header>
            <Nav />
          </header>
          <main>{children}</main>
        </JazzAndAuth>
      </body>
    </html>
  );
}
