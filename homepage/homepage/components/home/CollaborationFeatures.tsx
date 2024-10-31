import {H2, Kicker} from "gcmp-design-system/src/app/components/atoms/Headings";
import {Prose} from "gcmp-design-system/src/app/components/molecules/Prose";
import {FileLock2Icon} from "lucide-react";
import {GappedGrid} from "gcmp-design-system/src/app/components/molecules/GappedGrid";
import {LabelledFeatureIcon} from "gcmp-design-system/src/app/components/molecules/LabelledFeatureIcon";
import {CodeGroup} from "gcmp-design-system/src/app/components/molecules/CodeGroup";
import CollaborationPrivate from "./CollaborationPrivate.mdx";
import CollaborationPublic from "./CollaborationPublic.mdx";
import CollaborationInvite from "./CollaborationInvite.mdx";

export function CollaborationFeatures() {

    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <Kicker>Access control</Kicker>
        <H2>Taking collaboration a step further</H2>

        <Prose size="lg">
          <p>
            Every piece of data is assigned a role-based permission on creation &mdash; reader, writer, or admin.
            These permissions are defined in an <code>Account</code> or <code>Group</code>.
          </p>
        </Prose>

        <GappedGrid>
          <div className="col-span-2">
            <p className="font-semibold">Private</p>
            <p>
              Create a CoValue visible only to you by assigning your Account as an owner.
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
              Generate an invite link, and share only with people you want to collaborate with.
            </p>
            <CodeGroup>
              <CollaborationInvite></CollaborationInvite>
            </CodeGroup>
          </div>
        </GappedGrid>
      </div>
    );
}
