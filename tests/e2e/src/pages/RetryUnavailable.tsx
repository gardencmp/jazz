import { CoMap, Group, ID, co } from "jazz-tools";
import { useEffect, useState } from "react";
import { useAccount, useCoState } from "../jazz";

export class RetryUnavailableCoMap extends CoMap {
  value = co.string;
}

function getIdParam() {
  const url = new URL(window.location.href);
  return (url.searchParams.get("id") as ID<RetryUnavailableCoMap>) ?? undefined;
}

export function RetryUnavailable() {
  const [id, setId] = useState(getIdParam);
  const coMap = useCoState(RetryUnavailableCoMap, id);
  const { me } = useAccount();

  useEffect(() => {
    if (id) {
      const url = new URL(window.location.href);
      url.searchParams.set("id", id);
      history.pushState({}, "", url.toString());
    }
  }, [id]);

  const createCoMap = () => {
    if (!me || id) return;

    const group = Group.create({ owner: me });

    group.addMember("everyone", "writer");

    setId(
      RetryUnavailableCoMap.create({ value: "Hello!" }, { owner: group }).id,
    );
  };

  return (
    <div>
      <h1>Retry Unavailable</h1>
      <p data-testid="id">{coMap?.id}</p>
      <button onClick={createCoMap}>Create a new value!</button>
    </div>
  );
}
