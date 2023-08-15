import { expect, test } from 'vitest'
import { LocalNode,  } from 'cojson';
import { getAgentID, newRandomAgentSecret } from 'cojson/src/crypto';
import { newRandomSessionID } from 'cojson/src/coValue';
import { AnonymousControlledAccount } from 'cojson/src/account';
import { IDBStorage } from '.';

test("Should be able to initialize and load from empty DB", async () => {
    const agentSecret = newRandomAgentSecret();

    const node = new LocalNode(new AnonymousControlledAccount(agentSecret), newRandomSessionID(getAgentID(agentSecret)));

    await IDBStorage.connectTo(node, {trace: true});

    console.log("yay!");

    const team = node.createTeam();

    await new Promise(resolve => setTimeout(resolve, 200));

    expect(node.sync.peers["storage"]).toBeDefined();
});