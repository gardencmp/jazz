import { ClassRef, NavPackage, PropRef } from "./tags";

export function DocNav() {
    return (
        <>
            <p>Quickstart</p>

            <ul>
                <li>Collaborative counter</li>
            </ul>

            <p>Guide</p>

            <ul>
                <li>Intro to CoValues</li>
                <li>Refs, Load & Subscribe</li>
                <li>Groups & Permissions</li>
                <li>Accounts & Migrations</li>
                <li>Backend Workers & App&nbsp;Architectures</li>
            </ul>

            <p>API (main packages)</p>

            <NavPackage name="jazz-tools">
                <ul>
                    <li>
                        <ClassRef name="CoMap" />, <ClassRef name="CoList" />
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

            <p>API (supporting packages)</p>

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
