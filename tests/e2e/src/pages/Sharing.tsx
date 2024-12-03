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
  const [inviteLink, setInviteLink] = useState<string | undefined>(undefined);
  const coList = useCoState(SharedCoList, id, [{}]);

  const createCoList = () => {
    if (!me || id) return;

    const group = Group.create({ owner: me });

    const coList = SharedCoList.create([], { owner: group });

    setInviteLink(createInviteLink(coList, "writer"));

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
      <p data-testid="invite-link">{inviteLink}</p>
      <pre data-testid="values">
        {coList?.map((coMap) => coMap.value).join(", ")}
      </pre>
      {!id && <button onClick={createCoList}>Create a new list!</button>}
      {coList && <button onClick={addCoMap}>Add a new value!</button>}
      {Boolean(coList?.length) && (
        <button onClick={shareCoMaps}>Share the co-maps!</button>
      )}
    </div>
  );
}
