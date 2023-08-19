import { AgentSecret, createdNowUnique, getAgentID, newRandomAgentSecret  } from "./crypto.js";
import { newRandomSessionID } from "./coValue.js";
import { LocalNode } from "./node.js";
import { expectTeamContent } from "./team.js";
import { AnonymousControlledAccount } from "./account.js";
import { SessionID } from "./ids.js";

export function randomAnonymousAccountAndSessionID(): [AnonymousControlledAccount, SessionID] {
    const agentSecret = newRandomAgentSecret();

    const sessionID = newRandomSessionID(getAgentID(agentSecret));

    return [new AnonymousControlledAccount(agentSecret), sessionID];
}

export function newTeam() {
    const [admin, sessionID] = randomAnonymousAccountAndSessionID();

    const node = new LocalNode(admin, sessionID);

    const team = node.createCoValue({
        type: "comap",
        ruleset: { type: "team", initialAdmin: admin.id },
        meta: null,
        ...createdNowUnique(),
    });

    const teamContent = expectTeamContent(team.getCurrentContent());

    teamContent.edit((editable) => {
        editable.set(admin.id, "admin", "trusting");
        expect(editable.get(admin.id)).toEqual("admin");
    });

    return { node, team, admin };
}

export function teamWithTwoAdmins() {
    const { team, admin, node } = newTeam();

    const otherAdmin = node.createAccount("otherAdmin");

    let content = expectTeamContent(team.getCurrentContent());

    content.edit((editable) => {
        editable.set(otherAdmin.id, "admin", "trusting");
        expect(editable.get(otherAdmin.id)).toEqual("admin");
    });

    content = expectTeamContent(team.getCurrentContent());

    if (content.type !== "comap") {
        throw new Error("Expected map");
    }

    expect(content.get(otherAdmin.id)).toEqual("admin");
    return { team, admin, otherAdmin, node };
}

export function newTeamHighLevel() {
    const [admin, sessionID] = randomAnonymousAccountAndSessionID();


    const node = new LocalNode(admin, sessionID);

    const team = node.createTeam();

    return { admin, node, team };
}

export function teamWithTwoAdminsHighLevel() {
    const { admin, node, team } = newTeamHighLevel();

    const otherAdmin = node.createAccount("otherAdmin");

    team.addMember(otherAdmin.id, "admin");

    return { admin, node, team, otherAdmin };
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

