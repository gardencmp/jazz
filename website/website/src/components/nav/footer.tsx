"use client";

import { GcmpLogo } from "../logos";
import { NavLink } from "./nav-link";
import { primaryItems, secondaryItems, socialLinks } from "./main-nav-data";
import { Newsletter } from "../newsletter";
import clsx from "clsx";

const colStyle = `flex flex-col gap-0.5`;
const colHeadingStyle = `Text-meta pb-2`;

export const Footer = () => (
  <footer className="bg-background-subtle py-w24">
    <div className="container max-w-docs grid grid-cols-12 gap-w6 text-small">
      <div className={clsx("col-span-7", colStyle)}>
        <GcmpLogo monochrome className="w-32" />
        <p className="max-sm:text-right mt-auto text-meta">
          © {new Date().getFullYear()} Garden Computing, Inc.
        </p>
      </div>

      <div className="col-span-5">
        <div className="flex justify-between gap-w6">
          <div className={clsx(colStyle)}>
            <h2 className={colHeadingStyle}>Resources</h2>
            {primaryItems.map((item, i) => (
              <NavLink
                key={i}
                href={item.href}
                newTab={item.newTab}
                className="!px-0"
              >
                {item.title}
              </NavLink>
            ))}
          </div>
          <div className={clsx(colStyle)}>
            <h2 className={colHeadingStyle}>Community</h2>
            {socialLinks.map((item, i) => (
              <NavLink
                key={i}
                href={item.href}
                newTab={item.newTab}
                className="!px-0"
              >
                {item.title}
              </NavLink>
            ))}
          </div>
          <div className={clsx(colStyle)}>
            <h2 className={colHeadingStyle}>News</h2>
            {secondaryItems.map((item, i) => (
              <NavLink
                key={i}
                href={item.href}
                newTab={item.newTab}
                className="!px-0"
              >
                {item.title}
              </NavLink>
            ))}
          </div>
        </div>
        <div className="pt-w8">
          <Newsletter />
        </div>
      </div>
    </div>
  </footer>
);
