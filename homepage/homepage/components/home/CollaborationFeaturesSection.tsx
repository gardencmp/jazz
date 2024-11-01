import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import { KeyRoundIcon, LockIcon } from "lucide-react";
import { GappedGrid } from "gcmp-design-system/src/app/components/molecules/GappedGrid";
import { CodeGroup } from "gcmp-design-system/src/app/components/molecules/CodeGroup";
import CollaborationPrivate from "./CollaborationPrivate.mdx";
import CollaborationPublic from "./CollaborationPublic.mdx";
import CollaborationInvite from "./CollaborationInvite.mdx";
import { SectionHeader } from "gcmp-design-system/src/app/components/molecules/SectionHeader";

const data = [
    {
        title: "Private",
        description:
            "Create a CoValue visible only to you by assigning your Account as an owner.",
        codeSample: CollaborationPrivate,
    },
    {
        title: "Public",
        description: "Start collaborating by giving write access to everyone.",
        codeSample: CollaborationPublic,
    },
    {
        title: "Invite-only",
        description:
            "Generate an invite link, and share only with people you want to collaborate with.",
        codeSample: CollaborationInvite,
    },
];
export function CollaborationFeaturesSection() {
    return (
        <div>
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
                {data.map(({ title, description, codeSample: CodeSample }) => (
                    <div
                        className="col-span-2 border rounded-xl shadow-sm pt-4 px-4 flex flex-col gap-3"
                        key={title}
                    >
                        <div>
                            <h3 className="text-stone-900 font-medium md:text-base dark:text-stone-100 mb-2">
                                {title}
                            </h3>
                            <Prose>
                                <p>{description}</p>
                            </Prose>
                        </div>
                        <pre className="flex-1 text-sm border-t border-x rounded-t-lg bg-stone-50 dark:bg-stone-900">
                            <CodeSample />
                        </pre>
                    </div>
                ))}
            </GappedGrid>

            <div className="flex items-center gap-3 mt-4">
                <LockIcon size={20} className="text-blue dark:text-blue-500" />
                <Prose>
                    <p>
                        All data is <strong>end-to-end encrypted</strong> and
                        cryptographically signed by default, so it can&apos;t be
                        tampered with.
                    </p>
                </Prose>
            </div>
        </div>
    );
}
