"use client";

import { JazzLogo } from "@/components/logos";
import { JazzLogoTest } from "@/components/jazz-logo-test";
import clsx from "clsx";
import { primaryItems, secondaryItems, socialLinks } from "./main-nav-data";
import { NavLink, NavLinkLogo } from "./nav-link";

export function MainNav() {
  return (
    <>
      {/* DESKTOP */}
      <nav
        className={clsx(
          "hidden md:block",
          "sticky top-0 max-sm:bottom-0 w-full z-50 bg-canvas",
          // menuOpen ? "h-[100dvh]" : "h-auto",
        )}
      >
        <div className="container max-w-docs flex items-center justify-between h-nav">
          <div className="flex items-center gap-1">
            <NavLinkLogo prominent href="/" className="pr-w4">
              {/* <JazzLogo className="h-[36px] text-accent-fill" /> */}
              <JazzLogoTest className="text-accent-fill" height={23} />
            </NavLinkLogo>
            {primaryItems.map((item, i) => (
              <NavLink key={i} href={item.href}>
                {item.title}
              </NavLink>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {secondaryItems.map((item, i) => (
              <NavLink key={i} href={item.href} newTab={item.newTab}>
                {item.title}
              </NavLink>
            ))}
            <div className="flex items-center gap-w6 pl-w8">
              {socialLinks.map((item, i) => (
                <NavLinkLogo key={i} href={item.href} newTab={item.newTab}>
                  {item.icon}
                </NavLinkLogo>
              ))}
            </div>
          </div>
        </div>
        <hr className="-mt-px" />
      </nav>
    </>
  );
}
