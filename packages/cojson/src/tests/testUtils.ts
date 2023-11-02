import { AgentSecret, createdNowUnique, getAgentID, newRandomAgentSecret  } from "../crypto.js";
import { newRandomSessionID } from "../coValueCore.js";
import { LocalNode } from "../localNode.js";
import { expectGroup } from "../typeUtils/expectGroup.js";
import { ControlledAgent } from "../coValues/account.js";
import { SessionID } from "../ids.js";
// @ts-ignore
import { expect } from "bun:test";

export function randomAnonymousAccountAndSessionID(): [ControlledAgent, SessionID] {
    const agentSecret = newRandomAgentSecret();

    const sessionID = newRandomSessionID(getAgentID(agentSecret));

    return [new ControlledAgent(agentSecret), sessionID];
}

export function newGroup() {
    const [admin, sessionID] = randomAnonymousAccountAndSessionID();

    const node = new LocalNode(admin, sessionID);

    const groupCore = node.createCoValue({
        type: "comap",
        ruleset: { type: "group", initialAdmin: admin.id },
        meta: null,
        ...createdNowUnique(),
    });

    const group = expectGroup(groupCore.getCurrentContent());

    group.mutate((editable) => {
        editable.set(admin.id, "admin", "trusting");
        expect(editable.get(admin.id)).toEqual("admin");
    });

    return { node, groupCore, admin };
}

export function groupWithTwoAdmins() {
    const { groupCore, admin, node } = newGroup();

    const otherAdmin = node.createAccount("otherAdmin");

    let group = expectGroup(groupCore.getCurrentContent());

    group = group.mutate((mutable) => {
        mutable.set(otherAdmin.id, "admin", "trusting");
        expect(mutable.get(otherAdmin.id)).toEqual("admin");
    });

    if (group.type !== "comap") {
        throw new Error("Expected map");
    }

    expect(group.get(otherAdmin.id)).toEqual("admin");
    return { groupCore, admin, otherAdmin, node };
}

export function newGroupHighLevel() {
    const [admin, sessionID] = randomAnonymousAccountAndSessionID();


    const node = new LocalNode(admin, sessionID);

    const group = node.createGroup();

    return { admin, node, group };
}

export function groupWithTwoAdminsHighLevel() {
    let { admin, node, group } = newGroupHighLevel();

    const otherAdmin = node.createAccount("otherAdmin");

    group = group.addMember(otherAdmin, "admin");

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

