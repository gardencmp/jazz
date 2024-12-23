import { Account, CoMap, Group, ID, co } from "jazz-tools";
import { useEffect, useRef, useState } from "react";
import { useAccount, useInboxListener, useInboxSender } from "../jazz";
import { createCredentiallessIframe } from "../lib/createCredentiallessIframe";

export class PingPong extends CoMap {
  ping = co.json<number>();
  pong = co.optional.json<number>();
}

function getIdParam() {
  const url = new URL(window.location.href);
  return (url.searchParams.get("id") as ID<Account> | undefined) ?? undefined;
}

export function Inbox() {
  const [id] = useState(getIdParam);
  const { me } = useAccount();
  const [pingPong, setPingPong] = useState<PingPong | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>();

  useInboxListener(async (message) => {
    const pingPong = PingPong.create(
      { ping: message.ping, pong: Date.now() },
      { owner: message._owner },
    );
    setPingPong(pingPong);
  });

  const sendPingPong = useInboxSender(id);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const account = await Account.load(id, me, {});

      if (!account) return;

      const group = Group.create({ owner: me });
      group.addMember(account, "writer");
      const pingPong = PingPong.create({ ping: Date.now() }, { owner: group });

      sendPingPong(pingPong);
    }

    load();
  }, [id]);

  const handlePingPong = () => {
    if (!me || id) return;

    iframeRef.current?.remove();

    const url = new URL(window.location.href);
    url.searchParams.set("id", me.id);

    const iframe = createCredentiallessIframe(url.toString());
    document.body.appendChild(iframe);
    iframeRef.current = iframe;
  };

  return (
    <div>
      <h1>Inbox test</h1>
      <button onClick={handlePingPong}>Start a ping-pong</button>
      {pingPong && (
        <div data-testid="ping-pong">
          <p>Ping: {new Date(pingPong.ping).toISOString()}</p>
          <p>Pong: {new Date(pingPong.pong!).toISOString()}</p>
        </div>
      )}
    </div>
  );
}
