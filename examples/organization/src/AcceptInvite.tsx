import { useNavigate } from "react-router";
import { useAcceptInvite } from "./main.tsx";
import { Organization } from "./schema.ts";

export function AcceptInvite() {
  const navigate = useNavigate();
  useAcceptInvite({
    invitedObjectSchema: Organization,
    onAccept: (organizationId) => navigate("/organizations/" + organizationId),
  });

  return <p>Accepting invite...</p>;
}
