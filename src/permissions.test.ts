import { test, expect } from "bun:test";
import {
    AgentID,
    getAgent,
    getAgentID,
    newRandomAgentCredential,
    newRandomSessionID,
} from "./multilog";
import { LocalNode } from "./node";
import { CoJsonValue } from ".";
import { CoMap } from "./cojsonValue";
import { Role } from "./permissions";

function teamWithTwoAdmins() {
    const { multilog, admin, adminID } = newTeam();

    const otherAdmin = newRandomAgentCredential();
    const otherAdminID = getAgentID(getAgent(otherAdmin));

    let content = expectTeam(multilog.getCurrentContent());

    content.edit((editable) => {
        editable.set(otherAdminID, "admin", "trusting");
        expect(editable.get(otherAdminID)).toEqual("admin");
    });

    content = expectTeam(multilog.getCurrentContent());

    if (content.type !== "comap") {
        throw new Error("Expected map");
    }

    expect(content.get(otherAdminID)).toEqual("admin");
    return { multilog, admin, adminID, otherAdmin, otherAdminID };
}

function newTeam() {
    const admin = newRandomAgentCredential();
    const adminID = getAgentID(getAgent(admin));

    const node = new LocalNode(admin, newRandomSessionID(adminID));

    const multilog = node.createMultiLog({
        type: "comap",
        ruleset: { type: "team", initialAdmin: adminID },
        meta: null,
    });

    const content = expectTeam(multilog.getCurrentContent());

    content.edit((editable) => {
        editable.set(adminID, "admin", "trusting");
        expect(editable.get(adminID)).toEqual("admin");
    });

    return { node, multilog, admin, adminID };
}

function expectTeam(content: CoJsonValue): CoMap<AgentID, Role, {}> {
    if (content.type !== "comap") {
        throw new Error("Expected map");
    }

    return content as CoMap<AgentID, Role, {}>;
}

function expectMap(content: CoJsonValue): CoMap<string, string, {}> {
    if (content.type !== "comap") {
        throw new Error("Expected map");
    }

    return content as CoMap<string, string, {}>;
}

test("Initial admin can add another admin to a team", () => {
    teamWithTwoAdmins();
});

test("Added admin can add a third admin to a team", () => {
    const { multilog, otherAdmin, otherAdminID } = teamWithTwoAdmins();

    const otherAdminMultilog = multilog.testWithDifferentCredentials(
        otherAdmin,
        newRandomSessionID(otherAdminID)
    );

    let otherContent = expectTeam(otherAdminMultilog.getCurrentContent());

    expect(otherContent.get(otherAdminID)).toEqual("admin");

    const thirdAdmin = newRandomAgentCredential();
    const thirdAdminID = getAgentID(getAgent(thirdAdmin));

    otherContent.edit((editable) => {
        editable.set(thirdAdminID, "admin", "trusting");
        expect(editable.get(thirdAdminID)).toEqual("admin");
    });

    otherContent = expectTeam(otherAdminMultilog.getCurrentContent());

    expect(otherContent.get(thirdAdminID)).toEqual("admin");
});

test("Admins can't demote other admins in a team", () => {
    const { multilog, adminID, otherAdmin, otherAdminID } = teamWithTwoAdmins();

    let content = expectTeam(multilog.getCurrentContent());

    content.edit((editable) => {
        editable.set(otherAdminID, "writer", "trusting");
        expect(editable.get(otherAdminID)).toEqual("admin");
    });

    content = expectTeam(multilog.getCurrentContent());
    expect(content.get(otherAdminID)).toEqual("admin");

    const otherAdminMultilog = multilog.testWithDifferentCredentials(
        otherAdmin,
        newRandomSessionID(otherAdminID)
    );

    let otherContent = expectTeam(otherAdminMultilog.getCurrentContent());

    otherContent.edit((editable) => {
        editable.set(adminID, "writer", "trusting");
        expect(editable.get(adminID)).toEqual("admin");
    });

    otherContent = expectTeam(otherAdminMultilog.getCurrentContent());

    expect(otherContent.get(adminID)).toEqual("admin");
});

test("Admins an add writers to a team, who can't add admins, writers, or readers", () => {
    const { multilog } = newTeam();
    const writer = newRandomAgentCredential();
    const writerID = getAgentID(getAgent(writer));

    let content = expectTeam(multilog.getCurrentContent());

    content.edit((editable) => {
        editable.set(writerID, "writer", "trusting");
        expect(editable.get(writerID)).toEqual("writer");
    });

    content = expectTeam(multilog.getCurrentContent());
    expect(content.get(writerID)).toEqual("writer");

    const writerMultilog = multilog.testWithDifferentCredentials(
        writer,
        newRandomSessionID(writerID)
    );

    let writerContent = expectTeam(writerMultilog.getCurrentContent());

    expect(writerContent.get(writerID)).toEqual("writer");

    const otherAgent = newRandomAgentCredential();
    const otherAgentID = getAgentID(getAgent(otherAgent));

    writerContent.edit((editable) => {
        editable.set(otherAgentID, "admin", "trusting");
        expect(editable.get(otherAgentID)).toBeUndefined();

        editable.set(otherAgentID, "writer", "trusting");
        expect(editable.get(otherAgentID)).toBeUndefined();

        editable.set(otherAgentID, "reader", "trusting");
        expect(editable.get(otherAgentID)).toBeUndefined();
    });

    writerContent = expectTeam(writerMultilog.getCurrentContent());

    expect(writerContent.get(otherAgentID)).toBeUndefined();
});

test("Admins can add readers to a team, who can't add admins, writers, or readers", () => {
    const { multilog } = newTeam();
    const reader = newRandomAgentCredential();
    const readerID = getAgentID(getAgent(reader));

    let content = expectTeam(multilog.getCurrentContent());

    content.edit((editable) => {
        editable.set(readerID, "reader", "trusting");
        expect(editable.get(readerID)).toEqual("reader");
    });

    content = expectTeam(multilog.getCurrentContent());
    expect(content.get(readerID)).toEqual("reader");

    const readerMultilog = multilog.testWithDifferentCredentials(
        reader,
        newRandomSessionID(readerID)
    );

    let readerContent = expectTeam(readerMultilog.getCurrentContent());

    expect(readerContent.get(readerID)).toEqual("reader");

    const otherAgent = newRandomAgentCredential();
    const otherAgentID = getAgentID(getAgent(otherAgent));

    readerContent.edit((editable) => {
        editable.set(otherAgentID, "admin", "trusting");
        expect(editable.get(otherAgentID)).toBeUndefined();

        editable.set(otherAgentID, "writer", "trusting");
        expect(editable.get(otherAgentID)).toBeUndefined();

        editable.set(otherAgentID, "reader", "trusting");
        expect(editable.get(otherAgentID)).toBeUndefined();
    });

    readerContent = expectTeam(readerMultilog.getCurrentContent());

    expect(readerContent.get(otherAgentID)).toBeUndefined();
});

test("Admins can write to an object that is owned by their team", () => {
    const { node, multilog, adminID } = newTeam();

    const childObject = node.createMultiLog({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: multilog.id },
        meta: null,
    });

    let childContent = expectMap(childObject.getCurrentContent());

    childContent.edit((editable) => {
        editable.set("foo", "bar", "trusting");
        expect(editable.get("foo")).toEqual("bar");
    });

    childContent = expectMap(childObject.getCurrentContent());

    expect(childContent.get("foo")).toEqual("bar");
})

test("Writers can write to an object that is owned by their team", () => {
    const { node, multilog, adminID } = newTeam();

    const content = expectTeam(multilog.getCurrentContent());

    const writer = newRandomAgentCredential();
    const writerID = getAgentID(getAgent(writer));

    content.edit((editable) => {
        editable.set(writerID, "writer", "trusting");
        expect(editable.get(writerID)).toEqual("writer");
    });

    const childObject = node.createMultiLog({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: multilog.id },
        meta: null,
    });

    const childObjectAsWriter = childObject.testWithDifferentCredentials(
        writer,
        newRandomSessionID(writerID)
    );

    let childContent = expectMap(childObjectAsWriter.getCurrentContent());

    childContent.edit((editable) => {
        editable.set("foo", "bar", "trusting");
        expect(editable.get("foo")).toEqual("bar");
    });

    childContent = expectMap(childObjectAsWriter.getCurrentContent());

    expect(childContent.get("foo")).toEqual("bar");
});

test("Readers can not write to an object that is owned by their team", () => {
    const { node, multilog, adminID } = newTeam();

    const content = expectTeam(multilog.getCurrentContent());

    const reader = newRandomAgentCredential();
    const readerID = getAgentID(getAgent(reader));

    content.edit((editable) => {
        editable.set(readerID, "reader", "trusting");
        expect(editable.get(readerID)).toEqual("reader");
    });

    const childObject = node.createMultiLog({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: multilog.id },
        meta: null,
    });

    const childObjectAsReader = childObject.testWithDifferentCredentials(
        reader,
        newRandomSessionID(readerID)
    );

    let childContent = expectMap(childObjectAsReader.getCurrentContent());

    childContent.edit((editable) => {
        editable.set("foo", "bar", "trusting");
        expect(editable.get("foo")).toBeUndefined();
    });

    childContent = expectMap(childObjectAsReader.getCurrentContent());

    expect(childContent.get("foo")).toBeUndefined();
});
