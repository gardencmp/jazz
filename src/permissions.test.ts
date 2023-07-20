import { test, expect } from "bun:test";
import {
    getAgent,
    getAgentID,
    newRandomAgentCredential,
    newRandomSessionID,
} from "./multilog";
import { LocalNode } from "./node";
import { expectMap } from "./coValue";
import { expectTeam } from "./permissions";
import { getRecipientID, newRandomKeySecret, seal } from "./crypto";

function teamWithTwoAdmins() {
    const { team, admin, adminID } = newTeam();

    const otherAdmin = newRandomAgentCredential();
    const otherAdminID = getAgentID(getAgent(otherAdmin));

    let content = expectTeam(team.getCurrentContent());

    content.edit((editable) => {
        editable.set(otherAdminID, "admin", "trusting");
        expect(editable.get(otherAdminID)).toEqual("admin");
    });

    content = expectTeam(team.getCurrentContent());

    if (content.type !== "comap") {
        throw new Error("Expected map");
    }

    expect(content.get(otherAdminID)).toEqual("admin");
    return { team, admin, adminID, otherAdmin, otherAdminID };
}

function newTeam() {
    const admin = newRandomAgentCredential();
    const adminID = getAgentID(getAgent(admin));

    const node = new LocalNode(admin, newRandomSessionID(adminID));

    const team = node.createMultiLog({
        type: "comap",
        ruleset: { type: "team", initialAdmin: adminID },
        meta: null,
    });

    const teamContent = expectTeam(team.getCurrentContent());

    teamContent.edit((editable) => {
        editable.set(adminID, "admin", "trusting");
        expect(editable.get(adminID)).toEqual("admin");
    });

    return { node, team, admin, adminID };
}

test("Initial admin can add another admin to a team", () => {
    teamWithTwoAdmins();
});

test("Added admin can add a third admin to a team", () => {
    const { team, otherAdmin, otherAdminID } = teamWithTwoAdmins();

    const teamAsOtherAdmin = team.testWithDifferentCredentials(
        otherAdmin,
        newRandomSessionID(otherAdminID)
    );

    let otherContent = expectTeam(teamAsOtherAdmin.getCurrentContent());

    expect(otherContent.get(otherAdminID)).toEqual("admin");

    const thirdAdmin = newRandomAgentCredential();
    const thirdAdminID = getAgentID(getAgent(thirdAdmin));

    otherContent.edit((editable) => {
        editable.set(thirdAdminID, "admin", "trusting");
        expect(editable.get(thirdAdminID)).toEqual("admin");
    });

    otherContent = expectTeam(teamAsOtherAdmin.getCurrentContent());

    expect(otherContent.get(thirdAdminID)).toEqual("admin");
});

test("Admins can't demote other admins in a team", () => {
    const { team, adminID, otherAdmin, otherAdminID } = teamWithTwoAdmins();

    let teamContent = expectTeam(team.getCurrentContent());

    teamContent.edit((editable) => {
        editable.set(otherAdminID, "writer", "trusting");
        expect(editable.get(otherAdminID)).toEqual("admin");
    });

    teamContent = expectTeam(team.getCurrentContent());
    expect(teamContent.get(otherAdminID)).toEqual("admin");

    const teamAsOtherAdmin = team.testWithDifferentCredentials(
        otherAdmin,
        newRandomSessionID(otherAdminID)
    );

    let teamContentAsOtherAdmin = expectTeam(
        teamAsOtherAdmin.getCurrentContent()
    );

    teamContentAsOtherAdmin.edit((editable) => {
        editable.set(adminID, "writer", "trusting");
        expect(editable.get(adminID)).toEqual("admin");
    });

    teamContentAsOtherAdmin = expectTeam(teamAsOtherAdmin.getCurrentContent());

    expect(teamContentAsOtherAdmin.get(adminID)).toEqual("admin");
});

test("Admins an add writers to a team, who can't add admins, writers, or readers", () => {
    const { team } = newTeam();
    const writer = newRandomAgentCredential();
    const writerID = getAgentID(getAgent(writer));

    let teamContent = expectTeam(team.getCurrentContent());

    teamContent.edit((editable) => {
        editable.set(writerID, "writer", "trusting");
        expect(editable.get(writerID)).toEqual("writer");
    });

    teamContent = expectTeam(team.getCurrentContent());
    expect(teamContent.get(writerID)).toEqual("writer");

    const teamAsWriter = team.testWithDifferentCredentials(
        writer,
        newRandomSessionID(writerID)
    );

    let teamContentAsWriter = expectTeam(teamAsWriter.getCurrentContent());

    expect(teamContentAsWriter.get(writerID)).toEqual("writer");

    const otherAgent = newRandomAgentCredential();
    const otherAgentID = getAgentID(getAgent(otherAgent));

    teamContentAsWriter.edit((editable) => {
        editable.set(otherAgentID, "admin", "trusting");
        expect(editable.get(otherAgentID)).toBeUndefined();

        editable.set(otherAgentID, "writer", "trusting");
        expect(editable.get(otherAgentID)).toBeUndefined();

        editable.set(otherAgentID, "reader", "trusting");
        expect(editable.get(otherAgentID)).toBeUndefined();
    });

    teamContentAsWriter = expectTeam(teamAsWriter.getCurrentContent());

    expect(teamContentAsWriter.get(otherAgentID)).toBeUndefined();
});

test("Admins can add readers to a team, who can't add admins, writers, or readers", () => {
    const { team } = newTeam();
    const reader = newRandomAgentCredential();
    const readerID = getAgentID(getAgent(reader));

    let teamContent = expectTeam(team.getCurrentContent());

    teamContent.edit((editable) => {
        editable.set(readerID, "reader", "trusting");
        expect(editable.get(readerID)).toEqual("reader");
    });

    teamContent = expectTeam(team.getCurrentContent());
    expect(teamContent.get(readerID)).toEqual("reader");

    const teamAsReader = team.testWithDifferentCredentials(
        reader,
        newRandomSessionID(readerID)
    );

    let teamContentAsReader = expectTeam(teamAsReader.getCurrentContent());

    expect(teamContentAsReader.get(readerID)).toEqual("reader");

    const otherAgent = newRandomAgentCredential();
    const otherAgentID = getAgentID(getAgent(otherAgent));

    teamContentAsReader.edit((editable) => {
        editable.set(otherAgentID, "admin", "trusting");
        expect(editable.get(otherAgentID)).toBeUndefined();

        editable.set(otherAgentID, "writer", "trusting");
        expect(editable.get(otherAgentID)).toBeUndefined();

        editable.set(otherAgentID, "reader", "trusting");
        expect(editable.get(otherAgentID)).toBeUndefined();
    });

    teamContentAsReader = expectTeam(teamAsReader.getCurrentContent());

    expect(teamContentAsReader.get(otherAgentID)).toBeUndefined();
});

test("Admins can write to an object that is owned by their team", () => {
    const { node, team } = newTeam();

    const childObject = node.createMultiLog({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: team.id },
        meta: null,
    });

    let childContent = expectMap(childObject.getCurrentContent());

    childContent.edit((editable) => {
        editable.set("foo", "bar", "trusting");
        expect(editable.get("foo")).toEqual("bar");
    });

    childContent = expectMap(childObject.getCurrentContent());

    expect(childContent.get("foo")).toEqual("bar");
});

test("Writers can write to an object that is owned by their team", () => {
    const { node, team } = newTeam();

    const writer = newRandomAgentCredential();
    const writerID = getAgentID(getAgent(writer));

    expectTeam(team.getCurrentContent()).edit((editable) => {
        editable.set(writerID, "writer", "trusting");
        expect(editable.get(writerID)).toEqual("writer");
    });

    const childObject = node.createMultiLog({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: team.id },
        meta: null,
    });

    const childObjectAsWriter = childObject.testWithDifferentCredentials(
        writer,
        newRandomSessionID(writerID)
    );

    let childContentAsWriter = expectMap(childObjectAsWriter.getCurrentContent());

    childContentAsWriter.edit((editable) => {
        editable.set("foo", "bar", "trusting");
        expect(editable.get("foo")).toEqual("bar");
    });

    childContentAsWriter = expectMap(childObjectAsWriter.getCurrentContent());

    expect(childContentAsWriter.get("foo")).toEqual("bar");
});

test("Readers can not write to an object that is owned by their team", () => {
    const { node, team } = newTeam();

    const reader = newRandomAgentCredential();
    const readerID = getAgentID(getAgent(reader));

    expectTeam(team.getCurrentContent()).edit((editable) => {
        editable.set(readerID, "reader", "trusting");
        expect(editable.get(readerID)).toEqual("reader");
    });

    const childObject = node.createMultiLog({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: team.id },
        meta: null,
    });

    const childObjectAsReader = childObject.testWithDifferentCredentials(
        reader,
        newRandomSessionID(readerID)
    );

    let childContentAsReader = expectMap(childObjectAsReader.getCurrentContent());

    childContentAsReader.edit((editable) => {
        editable.set("foo", "bar", "trusting");
        expect(editable.get("foo")).toBeUndefined();
    });

    childContentAsReader = expectMap(childObjectAsReader.getCurrentContent());

    expect(childContentAsReader.get("foo")).toBeUndefined();
});

test("Admins can set team read key and then use it to create and read private transactions in owned objects", () => {
    const { node, team, admin, adminID } = newTeam();

    const teamContent = expectTeam(team.getCurrentContent());

    teamContent.edit((editable) => {
        const { secret: readKey, id: readKeyID } = newRandomKeySecret();
        const revelation = seal(
            readKey,
            admin.recipientSecret,
            new Set([getRecipientID(admin.recipientSecret)]),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );
        editable.set("readKey", { keyID: readKeyID, revelation });
        expect(editable.get("readKey")).toEqual({
            keyID: readKeyID,
            revelation,
        });
        expect(team.getCurrentReadKey().keySecret).toEqual(readKey);
    });

    const childObject = node.createMultiLog({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: team.id },
        meta: null,
    });

    let childContent = expectMap(childObject.getCurrentContent());

    childContent.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    childContent = expectMap(childObject.getCurrentContent());
    expect(childContent.get("foo")).toEqual("bar");
});

test("Admins can set team read key and then writers can use it to create and read private transactions in owned objects", () => {
    const { node, team, admin } = newTeam();

    const writer = newRandomAgentCredential();
    const writerID = getAgentID(getAgent(writer));
    const { secret: readKey, id: readKeyID } = newRandomKeySecret();

    const teamContent = expectTeam(team.getCurrentContent());

    teamContent.edit((editable) => {
        editable.set(writerID, "writer", "trusting");
        expect(editable.get(writerID)).toEqual("writer");

        const revelation = seal(
            readKey,
            admin.recipientSecret,
            new Set([getRecipientID(admin.recipientSecret), getRecipientID(writer.recipientSecret)]),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );
        editable.set("readKey", { keyID: readKeyID, revelation });
    });

    const childObject = node.createMultiLog({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: team.id },
        meta: null,
    });

    const childObjectAsWriter = childObject.testWithDifferentCredentials(
        writer,
        newRandomSessionID(writerID)
    );

    expect(childObject.getCurrentReadKey().keySecret).toEqual(readKey);

    let childContentAsWriter = expectMap(childObjectAsWriter.getCurrentContent());

    childContentAsWriter.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    childContentAsWriter = expectMap(childObjectAsWriter.getCurrentContent());

    expect(childContentAsWriter.get("foo")).toEqual("bar");
});

test("Admins can set team read key and then use it to create private transactions in owned objects, which readers can read", () => {
    const { node, team, admin } = newTeam();

    const reader = newRandomAgentCredential();
    const readerID = getAgentID(getAgent(reader));
    const { secret: readKey, id: readKeyID } = newRandomKeySecret();

    const teamContent = expectTeam(team.getCurrentContent());

    teamContent.edit((editable) => {
        editable.set(readerID, "reader", "trusting");
        expect(editable.get(readerID)).toEqual("reader");

        const revelation = seal(
            readKey,
            admin.recipientSecret,
            new Set([getRecipientID(admin.recipientSecret), getRecipientID(reader.recipientSecret)]),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );
        editable.set("readKey", { keyID: readKeyID, revelation });
    });

    const childObject = node.createMultiLog({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: team.id },
        meta: null,
    });

    expectMap(childObject.getCurrentContent()).edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    const childObjectAsReader = childObject.testWithDifferentCredentials(
        reader,
        newRandomSessionID(readerID)
    );

    expect(childObjectAsReader.getCurrentReadKey().keySecret).toEqual(readKey);

    const childContentAsReader = expectMap(childObjectAsReader.getCurrentContent());

    expect(childContentAsReader.get("foo")).toEqual("bar");
});

test("Admins can set team read key, make a private transaction in an owned object, rotate the read key, make another private transaction, and both can be read by the admin", () => {
    const { node, team, admin, adminID } = newTeam();

    const teamContent = expectTeam(team.getCurrentContent());

    teamContent.edit((editable) => {
        const { secret: readKey, id: readKeyID } = newRandomKeySecret();
        const revelation = seal(
            readKey,
            admin.recipientSecret,
            new Set([getRecipientID(admin.recipientSecret)]),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );
        editable.set("readKey", { keyID: readKeyID, revelation });
        expect(editable.get("readKey")).toEqual({
            keyID: readKeyID,
            revelation,
        });
        expect(team.getCurrentReadKey().keySecret).toEqual(readKey);
    });

    const childObject = node.createMultiLog({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: team.id },
        meta: null,
    });

    let childContent = expectMap(childObject.getCurrentContent());

    childContent.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    childContent = expectMap(childObject.getCurrentContent());
    expect(childContent.get("foo")).toEqual("bar");

    teamContent.edit((editable) => {
        const { secret: readKey2, id: readKeyID2 } = newRandomKeySecret();

        const revelation = seal(
            readKey2,
            admin.recipientSecret,
            new Set([getRecipientID(admin.recipientSecret)]),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );

        editable.set("readKey", { keyID: readKeyID2, revelation });
        expect(editable.get("readKey")).toEqual({
            keyID: readKeyID2,
            revelation,
        });
        expect(team.getCurrentReadKey().keySecret).toEqual(readKey2);
    });

    childContent = expectMap(childObject.getCurrentContent());
    expect(childContent.get("foo")).toEqual("bar");

    childContent.edit((editable) => {
        editable.set("foo2", "bar2", "private");
        expect(editable.get("foo2")).toEqual("bar2");
    });
    childContent = expectMap(childObject.getCurrentContent());
    expect(childContent.get("foo")).toEqual("bar");
    expect(childContent.get("foo2")).toEqual("bar2");
})