import { createInviteLink } from "jazz-react";
import { CoList, CoMap, Group, ID, co } from "jazz-tools";
import { useState } from "react";
import { useAcceptInvite, useAccount, useCoState } from "../jazz";

class SharedCoMap extends CoMap {
  value = co.string;
}

class SharedCoList extends CoList.Of(co.ref(SharedCoMap)) {}

export function Sharing() {
  const { me } = useAccount();
  const [id, setId] = useState<ID<SharedCoList> | undefined>(undefined);
  const [inviteLinks, setInviteLinks] = useState<Record<string, string>>({});
  const coList = useCoState(SharedCoList, id, [{}]);

  const createCoList = () => {
    if (!me || id) return;

    const group = Group.create({ owner: me });

    const coList = SharedCoList.create([], { owner: group });

    setInviteLinks({
      writer: createInviteLink(coList, "writer"),
      reader: createInviteLink(coList, "reader"),
      admin: createInviteLink(coList, "admin"),
    });

    setId(coList.id);
  };

  const addCoMap = () => {
    if (!me || !coList) return;

    const group = Group.create({ owner: me });

    const coMap = SharedCoMap.create(
      { value: "CoValue entry " + coList.length },
      { owner: group },
    );
    coList.push(coMap);
  };

  const shareCoMaps = () => {
    if (!coList) return;

    const coListGroup = coList._owner as Group;

    for (const coMap of coList) {
      const coMapGroup = coMap._owner as Group;
      coMapGroup.extend(coListGroup);
    }
  };

  const revokeAccess = () => {
    if (!coList) return;

    const coListGroup = coList._owner as Group;

    for (const member of coListGroup.members) {
      if (member.account && member.account.id !== me.id) {
        coListGroup.removeMember(member.account);
      }
    }
  };

  useAcceptInvite({
    invitedObjectSchema: SharedCoList,
    onAccept: (id) => {
      setId(id);
    },
  });

  return (
    <div>
      <h1>Sharing</h1>
      <p data-testid="id">{coList?.id}</p>
      {Object.entries(inviteLinks).map(([role, inviteLink]) => (
        <p key={role} data-testid={`invite-link-${role}`}>
          {inviteLink}
        </p>
      ))}
      <pre data-testid="values">
        {coList?.map((coMap) => coMap.value).join(", ")}
      </pre>
      {!id && <button onClick={createCoList}>Create a new list!</button>}
      {coList && <button onClick={addCoMap}>Add a new value!</button>}
      {coList && <button onClick={revokeAccess}>Revoke access!</button>}
      {Boolean(coList?.length) && (
        <button onClick={shareCoMaps}>Share the co-maps!</button>
      )}
    </div>
  );
}
