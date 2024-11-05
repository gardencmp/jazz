import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import { GappedGrid } from "gcmp-design-system/src/app/components/molecules/GappedGrid";
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
                title="Making secure collaboration the default"
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
                        <pre className="flex-1 text-sm border-t border-x rounded-t-lg bg-stone-50 dark:bg-stone-925">
                            <CodeSample />
                        </pre>
                    </div>
                ))}
            </GappedGrid>
        </div>
    );
}
