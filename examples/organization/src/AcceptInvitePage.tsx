import { ID } from "jazz-tools";
import { useNavigate } from "react-router";
import { useAcceptInvite, useAccount } from "./main.tsx";
import { Organization } from "./schema.ts";

export function AcceptInvitePage() {
  const navigate = useNavigate();
  const { me } = useAccount({ root: { organizations: [] } });

  const onAccept = (organizationId: ID<Organization>) => {
    if (me?.root?.organizations) {
      Organization.load(organizationId, me, []).then((organization) => {
        if (organization) {
          // avoid duplicates
          const ids = me.root.organizations.map(
            (organization) => organization?.id,
          );
          if (ids.includes(organizationId)) return;

          me.root.organizations.push(organization);
          navigate("/organizations/" + organizationId);
        }
      });
    }
  };

  useAcceptInvite({
    invitedObjectSchema: Organization,
    onAccept,
  });

  return <p>Accepting invite...</p>;
}
