import { AgentSecret, createdNowUnique, getAgentID, newRandomAgentSecret  } from "../crypto.js";
import { newRandomSessionID } from "../coValueCore.js";
import { LocalNode } from "../localNode.js";
import { expectGroupContent } from "../group.js";
import { AnonymousControlledAccount } from "../account.js";
import { SessionID } from "../ids.js";
// @ts-ignore
import { expect } from "bun:test";

export function randomAnonymousAccountAndSessionID(): [AnonymousControlledAccount, SessionID] {
    const agentSecret = newRandomAgentSecret();

    const sessionID = newRandomSessionID(getAgentID(agentSecret));

    return [new AnonymousControlledAccount(agentSecret), sessionID];
}

export function newGroup() {
    const [admin, sessionID] = randomAnonymousAccountAndSessionID();

    const node = new LocalNode(admin, sessionID);

    const group = node.createCoValue({
        type: "comap",
        ruleset: { type: "group", initialAdmin: admin.id },
        meta: null,
        ...createdNowUnique(),
    });

    const groupContent = expectGroupContent(group.getCurrentContent());

    groupContent.mutate((editable) => {
        editable.set(admin.id, "admin", "trusting");
        expect(editable.get(admin.id)).toEqual("admin");
    });

    return { node, group, admin };
}

export function groupWithTwoAdmins() {
    const { group, admin, node } = newGroup();

    const otherAdmin = node.createAccount("otherAdmin");

    let content = expectGroupContent(group.getCurrentContent());

    content.mutate((editable) => {
        editable.set(otherAdmin.id, "admin", "trusting");
        expect(editable.get(otherAdmin.id)).toEqual("admin");
    });

    content = expectGroupContent(group.getCurrentContent());

    if (content.type !== "comap") {
        throw new Error("Expected map");
    }

    expect(content.get(otherAdmin.id)).toEqual("admin");
    return { group, admin, otherAdmin, node };
}

export function newGroupHighLevel() {
    const [admin, sessionID] = randomAnonymousAccountAndSessionID();


    const node = new LocalNode(admin, sessionID);

    const group = node.createGroup();

    return { admin, node, group };
}

export function groupWithTwoAdminsHighLevel() {
    const { admin, node, group } = newGroupHighLevel();

    const otherAdmin = node.createAccount("otherAdmin");

    group.addMember(otherAdmin.id, "admin");

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

