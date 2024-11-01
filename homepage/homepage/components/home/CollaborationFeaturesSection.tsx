import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import { KeyRoundIcon } from "lucide-react";
import { GappedGrid } from "gcmp-design-system/src/app/components/molecules/GappedGrid";
import { CodeGroup } from "gcmp-design-system/src/app/components/molecules/CodeGroup";
import CollaborationPrivate from "./CollaborationPrivate.mdx";
import CollaborationPublic from "./CollaborationPublic.mdx";
import CollaborationInvite from "./CollaborationInvite.mdx";
import { SectionHeader } from "gcmp-design-system/src/app/components/molecules/SectionHeader";

export function CollaborationFeaturesSection() {
    return (
        <div className="flex flex-col gap-4 md:gap-6">
            <SectionHeader
                kicker="Role-based permissions"
                title="Taking collaboration a step further"
                slogan={
                    <>
                        Every piece of data is assigned a role-based permission
                        on creation &mdash; reader, writer, or admin. These
                        permissions are defined in an <code>Account</code> or{" "}
                        <code>Group</code>.
                    </>
                }
            ></SectionHeader>

            <GappedGrid>
                <div className="col-span-2">
                    <p className="font-semibold">Private</p>
                    <p>
                        Create a CoValue visible only to you by assigning your
                        Account as an owner.
                    </p>
                    <CodeGroup>
                        <CollaborationPrivate />
                    </CodeGroup>
                </div>
                <div className="col-span-2">
                    <p className="font-semibold">Public</p>
                    <p>
                        Start collaborating by giving write access to everyone.
                    </p>
                    <CodeGroup>
                        <CollaborationPublic />
                    </CodeGroup>
                </div>
                <div className="col-span-2">
                    <p className="font-semibold">Invite-only</p>
                    <p>
                        Generate an invite link, and share only with people you
                        want to collaborate with.
                    </p>
                    <CodeGroup>
                        <CollaborationInvite></CollaborationInvite>
                    </CodeGroup>
                </div>
            </GappedGrid>

            <div className="flex gap-4">
                <KeyRoundIcon
                    size={24}
                    className="size-8 text-blue p-1.5 rounded-lg bg-blue-50 dark:text-blue-500 dark:bg-stone-900 mb-2.5 md:size-10"
                />
                <Prose>
                    <p>
                        Data shared between users is{" "}
                        <strong>end-to-end encrypted</strong> and
                        cryptographically signed by default, so it can&apos;t be
                        tampered with.
                    </p>
                </Prose>
            </div>
        </div>
    );
}
