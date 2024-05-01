import { ReactNode } from "react";
import { ClassRef, NavPackage, PropRef } from "./tags";

export function DocNav() {
    return (
        <>
            <p className="mt-0 not-prose"><DocNavLink href="#quickstart">Quickstart</DocNavLink></p>

            <ul>
                <li><DocNavLink href="#build-a-chat-app">Build a chat app in 5min</DocNavLink></li>
            </ul>

            <p><DocNavLink href="#guide">Guide (build a Linear)</DocNavLink></p>

            <ul>
                <li><DocNavLink href="#intro-to-covalues">Intro to CoValues</DocNavLink></li>
                <li><DocNavLink href="#refs-load-and-subscribe">Refs, Load & Subscribe</DocNavLink></li>
                <li><DocNavLink href="#groups-and-permissions">Groups & Permissions</DocNavLink></li>
                <li><DocNavLink href="#accounts-and-migrations">Accounts & Migrations</DocNavLink></li>
                <li><DocNavLink href="#backend-workers">Backend Workers</DocNavLink></li>
            </ul>

            <p>API Reference</p>

            <NavPackage name="jazz-tools">
                <ul>
                    <li>
                    <DocNavLink href="#CoMap"><ClassRef name="CoMap" /></DocNavLink> & <DocNavLink href="#CoList"><ClassRef name="CoList" /></DocNavLink>
                    </li>
                    <li>
                        <ClassRef name="CoStream" />,{" "}
                        <ClassRef name="BinaryCoStream" />
                    </li>
                    <li>
                        <ClassRef name="Account" />, <ClassRef name="Group" />
                    </li>
                    <li>
                        <PropRef prop="co" />, Interfaces & Types
                    </li>
                    <li>
                        <ClassRef name="ImageDefinition" />
                    </li>
                </ul>
            </NavPackage>

            <NavPackage name="jazz-react">
                <ul>
                    <li>
                        <PropRef prop="JazzReact()" />
                    </li>
                    <ul>
                        <li>
                            <PropRef prop="<Provider/>" />
                        </li>
                        <li>
                            <PropRef prop="useAccount()" />
                        </li>
                        <li>
                            <PropRef prop="useCoState()" />
                        </li>
                    </ul>
                    <li>Auth Providers</li>
                    <li>
                        <PropRef prop="<ProgressiveImg/>" />
                    </li>
                </ul>
            </NavPackage>

            <NavPackage name="jazz-nodejs">
                <ul>
                    <li>
                        <PropRef prop="createOrResumeWorker()" />
                    </li>
                </ul>
            </NavPackage>

            <NavPackage name="jazz-browser">
                <ul>
                    <li>
                        <PropRef prop="createBrowserContext()" />
                    </li>
                    <li>Auth Providers</li>
                    <li>Invite Links</li>
                    <li>BinaryStream ↔︎ Blob</li>
                </ul>
            </NavPackage>

            <NavPackage name="jazz-browser-media-image">
                <ul>
                    <li>
                        <PropRef prop="createImage()" />
                    </li>
                </ul>
            </NavPackage>
        </>
    );
}

export function DocNavLink({href, children}: {href: string, children: ReactNode}) {
    return <a href={href} className="not-prose hover:text-black dark:hover:text-white">{children}</a>;
}