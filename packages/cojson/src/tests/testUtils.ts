import { expect } from "vitest";
import { newRandomSessionID } from "../coValueCore.js";
import { LocalNode } from "../localNode.js";
import { expectGroup } from "../typeUtils/expectGroup.js";
import { ControlledAgent } from "../coValues/account.js";
import { SessionID } from "../ids.js";
import { WasmCrypto } from "../crypto/WasmCrypto.js";

const Crypto = await WasmCrypto.create();

export function randomAnonymousAccountAndSessionID(): [ControlledAgent, SessionID] {
    const agentSecret = Crypto.newRandomAgentSecret();

    const sessionID = newRandomSessionID(Crypto.getAgentID(agentSecret));

    return [new ControlledAgent(agentSecret, Crypto), sessionID];
}

export function newGroup() {
    const [admin, sessionID] = randomAnonymousAccountAndSessionID();

    const node = new LocalNode(admin, sessionID, Crypto);

    const groupCore = node.createCoValue({
        type: "comap",
        ruleset: { type: "group", initialAdmin: admin.id },
        meta: null,
        ...Crypto.createdNowUnique(),
    });

    const group = expectGroup(groupCore.getCurrentContent());

    group.set(admin.id, "admin", "trusting");
        expect(group.get(admin.id)).toEqual("admin");

    return { node, groupCore, admin };
}

export function groupWithTwoAdmins() {
    const { groupCore, admin, node } = newGroup();

    const otherAdmin = node.createAccount();

    const group = expectGroup(groupCore.getCurrentContent());

        group.set(otherAdmin.id, "admin", "trusting");
        expect(group.get(otherAdmin.id)).toEqual("admin");

    if (group.type !== "comap") {
        throw new Error("Expected map");
    }

    expect(group.get(otherAdmin.id)).toEqual("admin");
    return { groupCore, admin, otherAdmin, node };
}

export function newGroupHighLevel() {
    const [admin, sessionID] = randomAnonymousAccountAndSessionID();


    const node = new LocalNode(admin, sessionID, Crypto);

    const group = node.createGroup();

    return { admin, node, group };
}

export function groupWithTwoAdminsHighLevel() {
    const { admin, node, group } = newGroupHighLevel();

    const otherAdmin = node.createAccount();

    group.addMember(otherAdmin, "admin");

    return { admin, node, group, otherAdmin };
}

export function shouldNotResolve<T>(
    promise: Promise<T>,
    ops: { timeout: number }
): Promise<void> {
    return new Promise((resolve, reject) => {
        promise
            .then((v) =>
                reject(
                    new Error(
                        "Should not have resolved, but resolved to " +
                            JSON.stringify(v)
                    )
                )
            )
            .catch(reject);
        setTimeout(resolve, ops.timeout);
    });
}

