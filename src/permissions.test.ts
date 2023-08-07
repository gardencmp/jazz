import {
    getAgent,
    getAgentID,
    newRandomAgentCredential,
    newRandomSessionID,
} from "./coValue";
import { LocalNode } from "./node";
import { expectMap } from "./contentType";
import { expectTeamContent } from "./permissions";
import {
    getRecipientID,
    newRandomKeySecret,
    seal,
    sealKeySecret,
} from "./crypto";

function teamWithTwoAdmins() {
    const { team, admin, adminID } = newTeam();

    const otherAdmin = newRandomAgentCredential("otherAdmin");
    const otherAdminID = getAgentID(getAgent(otherAdmin));

    let content = expectTeamContent(team.getCurrentContent());

    content.edit((editable) => {
        editable.set(otherAdminID, "admin", "trusting");
        expect(editable.get(otherAdminID)).toEqual("admin");
    });

    content = expectTeamContent(team.getCurrentContent());

    if (content.type !== "comap") {
        throw new Error("Expected map");
    }

    expect(content.get(otherAdminID)).toEqual("admin");
    return { team, admin, adminID, otherAdmin, otherAdminID };
}

function newTeam() {
    const admin = newRandomAgentCredential("admin");
    const adminID = getAgentID(getAgent(admin));

    const node = new LocalNode(admin, newRandomSessionID(adminID));

    const team = node.createCoValue({
        type: "comap",
        ruleset: { type: "team", initialAdmin: adminID },
        meta: null,
        publicNickname: "team"
    });

    const teamContent = expectTeamContent(team.getCurrentContent());

    teamContent.edit((editable) => {
        editable.set(adminID, "admin", "trusting");
        expect(editable.get(adminID)).toEqual("admin");
    });

    return { node, team, admin, adminID };
}

test("Initial admin can add another admin to a team", () => {
    teamWithTwoAdmins();
});

function newTeamHighLevel() {
    const admin = newRandomAgentCredential("admin");
    const adminID = getAgentID(getAgent(admin));

    const node = new LocalNode(admin, newRandomSessionID(adminID));

    const team = node.createTeam();

    return { admin, adminID, node, team };
}

function teamWithTwoAdminsHighLevel() {
    const { admin, adminID, node, team } = newTeamHighLevel();

    const otherAdmin = newRandomAgentCredential("otherAdmin");
    const otherAdminID = getAgentID(getAgent(otherAdmin));

    node.addKnownAgent(getAgent(otherAdmin));

    team.addMember(otherAdminID, "admin");

    return { admin, adminID, node, team, otherAdmin, otherAdminID };
}

test("Initial admin can add another admin to a team (high level)", () => {
    teamWithTwoAdminsHighLevel();
});

test("Added admin can add a third admin to a team", () => {
    const { team, otherAdmin, otherAdminID } = teamWithTwoAdmins();

    const teamAsOtherAdmin = team.testWithDifferentCredentials(
        otherAdmin,
        newRandomSessionID(otherAdminID)
    );

    let otherContent = expectTeamContent(teamAsOtherAdmin.getCurrentContent());

    expect(otherContent.get(otherAdminID)).toEqual("admin");

    const thirdAdmin = newRandomAgentCredential("admin");
    const thirdAdminID = getAgentID(getAgent(thirdAdmin));

    otherContent.edit((editable) => {
        editable.set(thirdAdminID, "admin", "trusting");
        expect(editable.get(thirdAdminID)).toEqual("admin");
    });

    otherContent = expectTeamContent(teamAsOtherAdmin.getCurrentContent());

    expect(otherContent.get(thirdAdminID)).toEqual("admin");
});

test("Added adming can add a third admin to a team (high level)", () => {
    const { team, otherAdmin, otherAdminID, node } =
        teamWithTwoAdminsHighLevel();

    const teamAsOtherAdmin = team.testWithDifferentCredentials(
        otherAdmin,
        newRandomSessionID(otherAdminID)
    );

    const thirdAdmin = newRandomAgentCredential("admin");
    const thirdAdminID = getAgentID(getAgent(thirdAdmin));

    node.addKnownAgent(getAgent(thirdAdmin));

    teamAsOtherAdmin.addMember(thirdAdminID, "admin");

    expect(teamAsOtherAdmin.teamMap.get(thirdAdminID)).toEqual("admin");
});

test("Admins can't demote other admins in a team", () => {
    const { team, adminID, otherAdmin, otherAdminID } = teamWithTwoAdmins();

    let teamContent = expectTeamContent(team.getCurrentContent());

    teamContent.edit((editable) => {
        editable.set(otherAdminID, "writer", "trusting");
        expect(editable.get(otherAdminID)).toEqual("admin");
    });

    teamContent = expectTeamContent(team.getCurrentContent());
    expect(teamContent.get(otherAdminID)).toEqual("admin");

    const teamAsOtherAdmin = team.testWithDifferentCredentials(
        otherAdmin,
        newRandomSessionID(otherAdminID)
    );

    let teamContentAsOtherAdmin = expectTeamContent(
        teamAsOtherAdmin.getCurrentContent()
    );

    teamContentAsOtherAdmin.edit((editable) => {
        editable.set(adminID, "writer", "trusting");
        expect(editable.get(adminID)).toEqual("admin");
    });

    teamContentAsOtherAdmin = expectTeamContent(
        teamAsOtherAdmin.getCurrentContent()
    );

    expect(teamContentAsOtherAdmin.get(adminID)).toEqual("admin");
});

test("Admins can't demote other admins in a team (high level)", () => {
    const { team, adminID, otherAdmin, otherAdminID } =
        teamWithTwoAdminsHighLevel();

    const teamAsOtherAdmin = team.testWithDifferentCredentials(
        otherAdmin,
        newRandomSessionID(otherAdminID)
    );

    expect(() => teamAsOtherAdmin.addMember(adminID, "writer")).toThrow(
        "Failed to set role"
    );

    expect(teamAsOtherAdmin.teamMap.get(adminID)).toEqual("admin");
});

test("Admins an add writers to a team, who can't add admins, writers, or readers", () => {
    const { team } = newTeam();
    const writer = newRandomAgentCredential("writer");
    const writerID = getAgentID(getAgent(writer));

    let teamContent = expectTeamContent(team.getCurrentContent());

    teamContent.edit((editable) => {
        editable.set(writerID, "writer", "trusting");
        expect(editable.get(writerID)).toEqual("writer");
    });

    teamContent = expectTeamContent(team.getCurrentContent());
    expect(teamContent.get(writerID)).toEqual("writer");

    const teamAsWriter = team.testWithDifferentCredentials(
        writer,
        newRandomSessionID(writerID)
    );

    let teamContentAsWriter = expectTeamContent(
        teamAsWriter.getCurrentContent()
    );

    expect(teamContentAsWriter.get(writerID)).toEqual("writer");

    const otherAgent = newRandomAgentCredential("otherAgent");
    const otherAgentID = getAgentID(getAgent(otherAgent));

    teamContentAsWriter.edit((editable) => {
        editable.set(otherAgentID, "admin", "trusting");
        expect(editable.get(otherAgentID)).toBeUndefined();

        editable.set(otherAgentID, "writer", "trusting");
        expect(editable.get(otherAgentID)).toBeUndefined();

        editable.set(otherAgentID, "reader", "trusting");
        expect(editable.get(otherAgentID)).toBeUndefined();
    });

    teamContentAsWriter = expectTeamContent(teamAsWriter.getCurrentContent());

    expect(teamContentAsWriter.get(otherAgentID)).toBeUndefined();
});

test("Admins an add writers to a team, who can't add admins, writers, or readers (high level)", () => {
    const { team, node } = newTeamHighLevel();

    const writer = newRandomAgentCredential("writer");
    const writerID = getAgentID(getAgent(writer));

    node.addKnownAgent(getAgent(writer));

    team.addMember(writerID, "writer");
    expect(team.teamMap.get(writerID)).toEqual("writer");

    const teamAsWriter = team.testWithDifferentCredentials(
        writer,
        newRandomSessionID(writerID)
    );

    expect(teamAsWriter.teamMap.get(writerID)).toEqual("writer");

    const otherAgent = newRandomAgentCredential("otherAgent");
    const otherAgentID = getAgentID(getAgent(otherAgent));

    node.addKnownAgent(getAgent(otherAgent));

    expect(() => teamAsWriter.addMember(otherAgentID, "admin")).toThrow(
        "Failed to set role"
    );
    expect(() => teamAsWriter.addMember(otherAgentID, "writer")).toThrow(
        "Failed to set role"
    );
    expect(() => teamAsWriter.addMember(otherAgentID, "reader")).toThrow(
        "Failed to set role"
    );

    expect(teamAsWriter.teamMap.get(otherAgentID)).toBeUndefined();
});

test("Admins can add readers to a team, who can't add admins, writers, or readers", () => {
    const { team } = newTeam();
    const reader = newRandomAgentCredential("reader");
    const readerID = getAgentID(getAgent(reader));

    let teamContent = expectTeamContent(team.getCurrentContent());

    teamContent.edit((editable) => {
        editable.set(readerID, "reader", "trusting");
        expect(editable.get(readerID)).toEqual("reader");
    });

    teamContent = expectTeamContent(team.getCurrentContent());
    expect(teamContent.get(readerID)).toEqual("reader");

    const teamAsReader = team.testWithDifferentCredentials(
        reader,
        newRandomSessionID(readerID)
    );

    let teamContentAsReader = expectTeamContent(
        teamAsReader.getCurrentContent()
    );

    expect(teamContentAsReader.get(readerID)).toEqual("reader");

    const otherAgent = newRandomAgentCredential("otherAgent");
    const otherAgentID = getAgentID(getAgent(otherAgent));

    teamContentAsReader.edit((editable) => {
        editable.set(otherAgentID, "admin", "trusting");
        expect(editable.get(otherAgentID)).toBeUndefined();

        editable.set(otherAgentID, "writer", "trusting");
        expect(editable.get(otherAgentID)).toBeUndefined();

        editable.set(otherAgentID, "reader", "trusting");
        expect(editable.get(otherAgentID)).toBeUndefined();
    });

    teamContentAsReader = expectTeamContent(teamAsReader.getCurrentContent());

    expect(teamContentAsReader.get(otherAgentID)).toBeUndefined();
});

test("Admins can add readers to a team, who can't add admins, writers, or readers (high level)", () => {
    const { team, node } = newTeamHighLevel();

    const reader = newRandomAgentCredential("reader");
    const readerID = getAgentID(getAgent(reader));

    node.addKnownAgent(getAgent(reader));

    team.addMember(readerID, "reader");
    expect(team.teamMap.get(readerID)).toEqual("reader");

    const teamAsReader = team.testWithDifferentCredentials(
        reader,
        newRandomSessionID(readerID)
    );

    expect(teamAsReader.teamMap.get(readerID)).toEqual("reader");

    const otherAgent = newRandomAgentCredential("otherAgent");
    const otherAgentID = getAgentID(getAgent(otherAgent));

    node.addKnownAgent(getAgent(otherAgent));

    expect(() => teamAsReader.addMember(otherAgentID, "admin")).toThrow(
        "Failed to set role"
    );
    expect(() => teamAsReader.addMember(otherAgentID, "writer")).toThrow(
        "Failed to set role"
    );
    expect(() => teamAsReader.addMember(otherAgentID, "reader")).toThrow(
        "Failed to set role"
    );

    expect(teamAsReader.teamMap.get(otherAgentID)).toBeUndefined();
});

test("Admins can write to an object that is owned by their team", () => {
    const { node, team } = newTeam();

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: team.id },
        meta: null,
        publicNickname: "childObject"
    });

    let childContent = expectMap(childObject.getCurrentContent());

    childContent.edit((editable) => {
        editable.set("foo", "bar", "trusting");
        expect(editable.get("foo")).toEqual("bar");
    });

    childContent = expectMap(childObject.getCurrentContent());

    expect(childContent.get("foo")).toEqual("bar");
});

test("Admins can write to an object that is owned by their team (high level)", () => {
    const { node, team } = newTeamHighLevel();

    let childObject = team.createMap();

    childObject = childObject.edit((editable) => {
        editable.set("foo", "bar", "trusting");
        expect(editable.get("foo")).toEqual("bar");
    });

    expect(childObject.get("foo")).toEqual("bar");
});

test("Writers can write to an object that is owned by their team", () => {
    const { node, team } = newTeam();

    const writer = newRandomAgentCredential("writer");
    const writerID = getAgentID(getAgent(writer));

    expectTeamContent(team.getCurrentContent()).edit((editable) => {
        editable.set(writerID, "writer", "trusting");
        expect(editable.get(writerID)).toEqual("writer");
    });

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: team.id },
        meta: null,
        publicNickname: "childObject"
    });

    const childObjectAsWriter = childObject.testWithDifferentCredentials(
        writer,
        newRandomSessionID(writerID)
    );

    let childContentAsWriter = expectMap(
        childObjectAsWriter.getCurrentContent()
    );

    childContentAsWriter.edit((editable) => {
        editable.set("foo", "bar", "trusting");
        expect(editable.get("foo")).toEqual("bar");
    });

    childContentAsWriter = expectMap(childObjectAsWriter.getCurrentContent());

    expect(childContentAsWriter.get("foo")).toEqual("bar");
});

test("Writers can write to an object that is owned by their team (high level)", () => {
    const { node, team } = newTeamHighLevel();

    const writer = newRandomAgentCredential("writer");
    const writerID = getAgentID(getAgent(writer));

    node.addKnownAgent(getAgent(writer));

    team.addMember(writerID, "writer");

    const childObject = team.createMap();

    let childObjectAsWriter = expectMap(
        childObject.coValue
            .testWithDifferentCredentials(writer, newRandomSessionID(writerID))
            .getCurrentContent()
    );

    childObjectAsWriter = childObjectAsWriter.edit((editable) => {
        editable.set("foo", "bar", "trusting");
        expect(editable.get("foo")).toEqual("bar");
    });

    expect(childObjectAsWriter.get("foo")).toEqual("bar");
});

test("Readers can not write to an object that is owned by their team", () => {
    const { node, team } = newTeam();

    const reader = newRandomAgentCredential("reader");
    const readerID = getAgentID(getAgent(reader));

    expectTeamContent(team.getCurrentContent()).edit((editable) => {
        editable.set(readerID, "reader", "trusting");
        expect(editable.get(readerID)).toEqual("reader");
    });

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: team.id },
        meta: null,
        publicNickname: "childObject"
    });

    const childObjectAsReader = childObject.testWithDifferentCredentials(
        reader,
        newRandomSessionID(readerID)
    );

    let childContentAsReader = expectMap(
        childObjectAsReader.getCurrentContent()
    );

    childContentAsReader.edit((editable) => {
        editable.set("foo", "bar", "trusting");
        expect(editable.get("foo")).toBeUndefined();
    });

    childContentAsReader = expectMap(childObjectAsReader.getCurrentContent());

    expect(childContentAsReader.get("foo")).toBeUndefined();
});

test("Readers can not write to an object that is owned by their team (high level)", () => {
    const { node, team } = newTeamHighLevel();

    const reader = newRandomAgentCredential("reader");
    const readerID = getAgentID(getAgent(reader));

    node.addKnownAgent(getAgent(reader));

    team.addMember(readerID, "reader");

    const childObject = team.createMap();

    let childObjectAsReader = expectMap(
        childObject.coValue
            .testWithDifferentCredentials(reader, newRandomSessionID(readerID))
            .getCurrentContent()
    );

    childObjectAsReader = childObjectAsReader.edit((editable) => {
        editable.set("foo", "bar", "trusting");
        expect(editable.get("foo")).toBeUndefined();
    });

    expect(childObjectAsReader.get("foo")).toBeUndefined();
});

test("Admins can set team read key and then use it to create and read private transactions in owned objects", () => {
    const { node, team, admin, adminID } = newTeam();

    const teamContent = expectTeamContent(team.getCurrentContent());

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
        editable.set("readKey", { keyID: readKeyID, revelation }, "trusting");
        expect(editable.get("readKey")).toEqual({
            keyID: readKeyID,
            revelation,
        });
        expect(team.getCurrentReadKey().secret).toEqual(readKey);
    });

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: team.id },
        meta: null,
        publicNickname: "childObject"
    });

    let childContent = expectMap(childObject.getCurrentContent());

    childContent.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    childContent = expectMap(childObject.getCurrentContent());
    expect(childContent.get("foo")).toEqual("bar");
});

test("Admins can set team read key and then use it to create and read private transactions in owned objects (high level)", () => {
    const { node, team, admin } = newTeamHighLevel();

    let childObject = team.createMap();

    childObject = childObject.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    expect(childObject.get("foo")).toEqual("bar");
});

test("Admins can set team read key and then writers can use it to create and read private transactions in owned objects", () => {
    const { node, team, admin } = newTeam();

    const writer = newRandomAgentCredential("writer");
    const writerID = getAgentID(getAgent(writer));
    const { secret: readKey, id: readKeyID } = newRandomKeySecret();

    const teamContent = expectTeamContent(team.getCurrentContent());

    teamContent.edit((editable) => {
        editable.set(writerID, "writer", "trusting");
        expect(editable.get(writerID)).toEqual("writer");

        const revelation = seal(
            readKey,
            admin.recipientSecret,
            new Set([
                getRecipientID(admin.recipientSecret),
                getRecipientID(writer.recipientSecret),
            ]),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );
        editable.set("readKey", { keyID: readKeyID, revelation }, "trusting");
    });

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: team.id },
        meta: null,
        publicNickname: "childObject"
    });

    const childObjectAsWriter = childObject.testWithDifferentCredentials(
        writer,
        newRandomSessionID(writerID)
    );

    expect(childObject.getCurrentReadKey().secret).toEqual(readKey);

    let childContentAsWriter = expectMap(
        childObjectAsWriter.getCurrentContent()
    );

    childContentAsWriter.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    childContentAsWriter = expectMap(childObjectAsWriter.getCurrentContent());

    expect(childContentAsWriter.get("foo")).toEqual("bar");
});

test("Admins can set team read key and then writers can use it to create and read private transactions in owned objects (high level)", () => {
    const { node, team, admin } = newTeamHighLevel();

    const writer = newRandomAgentCredential("writer");
    const writerID = getAgentID(getAgent(writer));

    node.addKnownAgent(getAgent(writer));

    team.addMember(writerID, "writer");

    const childObject = team.createMap();

    let childObjectAsWriter = expectMap(
        childObject.coValue
            .testWithDifferentCredentials(writer, newRandomSessionID(writerID))
            .getCurrentContent()
    );

    childObjectAsWriter = childObjectAsWriter.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    expect(childObjectAsWriter.get("foo")).toEqual("bar");
});

test("Admins can set team read key and then use it to create private transactions in owned objects, which readers can read", () => {
    const { node, team, admin } = newTeam();

    const reader = newRandomAgentCredential("reader");
    const readerID = getAgentID(getAgent(reader));
    const { secret: readKey, id: readKeyID } = newRandomKeySecret();

    const teamContent = expectTeamContent(team.getCurrentContent());

    teamContent.edit((editable) => {
        editable.set(readerID, "reader", "trusting");
        expect(editable.get(readerID)).toEqual("reader");

        const revelation = seal(
            readKey,
            admin.recipientSecret,
            new Set([
                getRecipientID(admin.recipientSecret),
                getRecipientID(reader.recipientSecret),
            ]),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );
        editable.set("readKey", { keyID: readKeyID, revelation }, "trusting");
    });

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: team.id },
        meta: null,
        publicNickname: "childObject"
    });

    expectMap(childObject.getCurrentContent()).edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    const childObjectAsReader = childObject.testWithDifferentCredentials(
        reader,
        newRandomSessionID(readerID)
    );

    expect(childObjectAsReader.getCurrentReadKey().secret).toEqual(readKey);

    const childContentAsReader = expectMap(
        childObjectAsReader.getCurrentContent()
    );

    expect(childContentAsReader.get("foo")).toEqual("bar");
});

test("Admins can set team read key and then use it to create private transactions in owned objects, which readers can read (high level)", () => {
    const { node, team, admin } = newTeamHighLevel();

    const reader = newRandomAgentCredential("reader");
    const readerID = getAgentID(getAgent(reader));

    node.addKnownAgent(getAgent(reader));

    team.addMember(readerID, "reader");

    let childObject = team.createMap();

    childObject = childObject.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    const childContentAsReader = expectMap(childObject.coValue.testWithDifferentCredentials(
        reader,
        newRandomSessionID(readerID)
    ).getCurrentContent());

    expect(childContentAsReader.get("foo")).toEqual("bar");
});


test("Admins can set team read key and then use it to create private transactions in owned objects, which readers can read, even with a separate later revelation for the same read key", () => {
    const { node, team, admin } = newTeam();

    const reader1 = newRandomAgentCredential("reader1");
    const reader1ID = getAgentID(getAgent(reader1));
    const reader2 = newRandomAgentCredential("reader2");
    const reader2ID = getAgentID(getAgent(reader2));
    const { secret: readKey, id: readKeyID } = newRandomKeySecret();

    const teamContent = expectTeamContent(team.getCurrentContent());

    teamContent.edit((editable) => {
        editable.set(reader1ID, "reader", "trusting");
        expect(editable.get(reader1ID)).toEqual("reader");

        const revelation1 = seal(
            readKey,
            admin.recipientSecret,
            new Set([
                getRecipientID(admin.recipientSecret),
                getRecipientID(reader1.recipientSecret),
            ]),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );
        editable.set(
            "readKey",
            { keyID: readKeyID, revelation: revelation1 },
            "trusting"
        );

        const revelation2 = seal(
            readKey,
            admin.recipientSecret,
            new Set([getRecipientID(reader2.recipientSecret)]),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );
        editable.set(
            "readKey",
            { keyID: readKeyID, revelation: revelation2 },
            "trusting"
        );
    });

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: team.id },
        meta: null,
        publicNickname: "childObject"
    });

    expectMap(childObject.getCurrentContent()).edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    const childObjectAsReader1 = childObject.testWithDifferentCredentials(
        reader1,
        newRandomSessionID(reader1ID)
    );

    expect(childObjectAsReader1.getCurrentReadKey().secret).toEqual(readKey);

    const childContentAsReader1 = expectMap(
        childObjectAsReader1.getCurrentContent()
    );

    expect(childContentAsReader1.get("foo")).toEqual("bar");

    const childObjectAsReader2 = childObject.testWithDifferentCredentials(
        reader2,
        newRandomSessionID(reader2ID)
    );

    expect(childObjectAsReader2.getCurrentReadKey().secret).toEqual(readKey);

    const childContentAsReader2 = expectMap(
        childObjectAsReader2.getCurrentContent()
    );

    expect(childContentAsReader2.get("foo")).toEqual("bar");
});

test("Admins can set team read key and then use it to create private transactions in owned objects, which readers can read, even with a separate later revelation for the same read key (high level)", () => {
    const { node, team, admin } = newTeamHighLevel();

    const reader1 = newRandomAgentCredential("reader1");
    const reader1ID = getAgentID(getAgent(reader1));
    const reader2 = newRandomAgentCredential("reader2");
    const reader2ID = getAgentID(getAgent(reader2));

    node.addKnownAgent(getAgent(reader1));
    node.addKnownAgent(getAgent(reader2));

    team.addMember(reader1ID, "reader");

    let childObject = team.createMap();

    childObject = childObject.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    const childContentAsReader1 = expectMap(childObject.coValue.testWithDifferentCredentials(
        reader1,
        newRandomSessionID(reader1ID)
    ).getCurrentContent());

    expect(childContentAsReader1.get("foo")).toEqual("bar");

    team.addMember(reader2ID, "reader");

    const childContentAsReader2 = expectMap(childObject.coValue.testWithDifferentCredentials(
        reader2,
        newRandomSessionID(reader2ID)
    ).getCurrentContent());

    expect(childContentAsReader2.get("foo")).toEqual("bar");
});


test("Admins can set team read key, make a private transaction in an owned object, rotate the read key, make another private transaction, and both can be read by the admin", () => {
    const { node, team, admin, adminID } = newTeam();

    const teamContent = expectTeamContent(team.getCurrentContent());

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
        editable.set("readKey", { keyID: readKeyID, revelation }, "trusting");
        expect(editable.get("readKey")).toEqual({
            keyID: readKeyID,
            revelation,
        });
        expect(team.getCurrentReadKey().secret).toEqual(readKey);
    });

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: team.id },
        meta: null,
        publicNickname: "childObject"
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

        editable.set("readKey", { keyID: readKeyID2, revelation }, "trusting");
        expect(editable.get("readKey")).toEqual({
            keyID: readKeyID2,
            revelation,
        });
        expect(team.getCurrentReadKey().secret).toEqual(readKey2);
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
});

test("Admins can set team read key, make a private transaction in an owned object, rotate the read key, make another private transaction, and both can be read by the admin (high level)", () => {
    const { node, team, admin, adminID } = newTeamHighLevel();

    let childObject = team.createMap();

    const firstReadKey = childObject.coValue.getCurrentReadKey();

    childObject = childObject.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    expect(childObject.get("foo")).toEqual("bar");

    team.rotateReadKey();

    expect(childObject.coValue.getCurrentReadKey()).not.toEqual(firstReadKey);

    childObject = childObject.edit((editable) => {
        editable.set("foo2", "bar2", "private");
        expect(editable.get("foo2")).toEqual("bar2");
    });

    expect(childObject.get("foo")).toEqual("bar");
    expect(childObject.get("foo2")).toEqual("bar2");
});

test("Admins can set team read key, make a private transaction in an owned object, rotate the read key, add a reader, make another private transaction in the owned object, and both can be read by the reader", () => {
    const { node, team, admin, adminID } = newTeam();

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: team.id },
        meta: null,
        publicNickname: "childObject"
    });

    const teamContent = expectTeamContent(team.getCurrentContent());
    const { secret: readKey, id: readKeyID } = newRandomKeySecret();

    teamContent.edit((editable) => {
        const revelation = seal(
            readKey,
            admin.recipientSecret,
            new Set([getRecipientID(admin.recipientSecret)]),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );
        editable.set("readKey", { keyID: readKeyID, revelation }, "trusting");
        expect(editable.get("readKey")).toEqual({
            keyID: readKeyID,
            revelation,
        });
        expect(team.getCurrentReadKey().secret).toEqual(readKey);
    });

    let childContent = expectMap(childObject.getCurrentContent());

    childContent.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    childContent = expectMap(childObject.getCurrentContent());
    expect(childContent.get("foo")).toEqual("bar");

    const reader = newRandomAgentCredential("reader");
    const readerID = getAgentID(getAgent(reader));
    const { secret: readKey2, id: readKeyID2 } = newRandomKeySecret();

    teamContent.edit((editable) => {
        const revelation = seal(
            readKey2,
            admin.recipientSecret,
            new Set([
                getRecipientID(admin.recipientSecret),
                getRecipientID(reader.recipientSecret),
            ]),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );

        editable.set(
            "readKey",
            {
                keyID: readKeyID2,
                revelation,
                previousKeys: {
                    [readKeyID]: sealKeySecret({
                        toSeal: { id: readKeyID, secret: readKey },
                        sealing: { id: readKeyID2, secret: readKey2 },
                    }).encrypted,
                },
            },
            "trusting"
        );
        expect(editable.get("readKey")).toMatchObject({
            keyID: readKeyID2,
            revelation,
        });
        expect(team.getCurrentReadKey().secret).toEqual(readKey2);

        editable.set(readerID, "reader", "trusting");
        expect(editable.get(readerID)).toEqual("reader");
    });

    childContent.edit((editable) => {
        editable.set("foo2", "bar2", "private");
        expect(editable.get("foo2")).toEqual("bar2");
    });

    const childObjectAsReader = childObject.testWithDifferentCredentials(
        reader,
        newRandomSessionID(readerID)
    );

    expect(childObjectAsReader.getCurrentReadKey().secret).toEqual(readKey2);

    const childContentAsReader = expectMap(
        childObjectAsReader.getCurrentContent()
    );

    expect(childContentAsReader.get("foo")).toEqual("bar");
    expect(childContentAsReader.get("foo2")).toEqual("bar2");
});

test("Admins can set team read key, make a private transaction in an owned object, rotate the read key, add a reader, make another private transaction in the owned object, and both can be read by the reader (high level)", () => {
    const { node, team, admin, adminID } = newTeamHighLevel();

    let childObject = team.createMap();

    const firstReadKey = childObject.coValue.getCurrentReadKey();

    childObject = childObject.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    expect(childObject.get("foo")).toEqual("bar");

    team.rotateReadKey();

    expect(childObject.coValue.getCurrentReadKey()).not.toEqual(firstReadKey);

    const reader = newRandomAgentCredential("reader");
    const readerID = getAgentID(getAgent(reader));

    node.addKnownAgent(getAgent(reader));

    team.addMember(readerID, "reader");

    childObject = childObject.edit((editable) => {
        editable.set("foo2", "bar2", "private");
        expect(editable.get("foo2")).toEqual("bar2");
    });

    const childContentAsReader = expectMap(childObject.coValue.testWithDifferentCredentials(
        reader,
        newRandomSessionID(readerID)
    ).getCurrentContent());

    expect(childContentAsReader.get("foo")).toEqual("bar");
    expect(childContentAsReader.get("foo2")).toEqual("bar2");
})


test("Admins can set team read rey, make a private transaction in an owned object, rotate the read key, add two readers, rotate the read key again to kick out one reader, make another private transaction in the owned object, and only the remaining reader can read both transactions", () => {
    const { node, team, admin, adminID } = newTeam();

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: team.id },
        meta: null,
        publicNickname: "childObject"
    });

    const teamContent = expectTeamContent(team.getCurrentContent());
    const { secret: readKey, id: readKeyID } = newRandomKeySecret();
    const reader = newRandomAgentCredential("reader");
    const readerID = getAgentID(getAgent(reader));
    const reader2 = newRandomAgentCredential("reader2");
    const reader2ID = getAgentID(getAgent(reader));

    teamContent.edit((editable) => {
        const revelation = seal(
            readKey,
            admin.recipientSecret,
            new Set([
                getRecipientID(admin.recipientSecret),
                getRecipientID(reader.recipientSecret),
                getRecipientID(reader2.recipientSecret),
            ]),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );
        editable.set("readKey", { keyID: readKeyID, revelation }, "trusting");
        expect(editable.get("readKey")).toEqual({
            keyID: readKeyID,
            revelation,
        });
        expect(team.getCurrentReadKey().secret).toEqual(readKey);

        editable.set(readerID, "reader", "trusting");
        expect(editable.get(readerID)).toEqual("reader");
        editable.set(reader2ID, "reader", "trusting");
        expect(editable.get(reader2ID)).toEqual("reader");
    });

    let childContent = expectMap(childObject.getCurrentContent());

    childContent.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    childContent = expectMap(childObject.getCurrentContent());
    expect(childContent.get("foo")).toEqual("bar");

    let childObjectAsReader = childObject.testWithDifferentCredentials(
        reader,
        newRandomSessionID(readerID)
    );

    expect(
        expectMap(childObjectAsReader.getCurrentContent()).get("foo")
    ).toEqual("bar");

    let childObjectAsReader2 = childObject.testWithDifferentCredentials(
        reader,
        newRandomSessionID(readerID)
    );

    expect(
        expectMap(childObjectAsReader2.getCurrentContent()).get("foo")
    ).toEqual("bar");

    const { secret: readKey2, id: readKeyID2 } = newRandomKeySecret();

    teamContent.edit((editable) => {
        const revelation = seal(
            readKey2,
            admin.recipientSecret,
            new Set([
                getRecipientID(admin.recipientSecret),
                getRecipientID(reader2.recipientSecret),
            ]),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );
        editable.set("readKey", { keyID: readKeyID2, revelation }, "trusting");
        expect(editable.get("readKey")).toEqual({
            keyID: readKeyID2,
            revelation,
        });
        expect(team.getCurrentReadKey().secret).toEqual(readKey2);

        editable.set(readerID, "revoked", "trusting");
        // expect(editable.get(readerID)).toEqual("revoked");
    });

    expect(childObject.getCurrentReadKey().secret).toEqual(readKey2);

    childContent = expectMap(childObject.getCurrentContent());
    childContent.edit((editable) => {
        editable.set("foo2", "bar2", "private");
        expect(editable.get("foo2")).toEqual("bar2");
    });

    // TODO: make sure these instances of coValues sync between each other so this isn't necessary?
    childObjectAsReader = childObject.testWithDifferentCredentials(
        reader,
        newRandomSessionID(readerID)
    );
    childObjectAsReader2 = childObject.testWithDifferentCredentials(
        reader2,
        newRandomSessionID(reader2ID)
    );

    expect(() => expectMap(childObjectAsReader.getCurrentContent())).toThrow(
        /readKey (.+?) not revealed for (.+?)/
    );
    expect(
        expectMap(childObjectAsReader2.getCurrentContent()).get("foo2")
    ).toEqual("bar2");
    expect(() => {
        childObjectAsReader.getCurrentContent();
    }).toThrow();
});

test("Admins can set team read rey, make a private transaction in an owned object, rotate the read key, add two readers, rotate the read key again to kick out one reader, make another private transaction in the owned object, and only the remaining reader can read both transactions (high level)", () => {
    const { node, team, admin, adminID } = newTeamHighLevel();

    let childObject = team.createMap();


    childObject = childObject.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    expect(childObject.get("foo")).toEqual("bar");

    team.rotateReadKey();

    const secondReadKey = childObject.coValue.getCurrentReadKey();

    const reader = newRandomAgentCredential("reader");
    const readerID = getAgentID(getAgent(reader));
    const reader2 = newRandomAgentCredential("reader2");
    const reader2ID = getAgentID(getAgent(reader2));

    node.addKnownAgent(getAgent(reader));
    node.addKnownAgent(getAgent(reader2));

    team.addMember(readerID, "reader");
    team.addMember(reader2ID, "reader");

    childObject = childObject.edit((editable) => {
        editable.set("foo2", "bar2", "private");
        expect(editable.get("foo2")).toEqual("bar2");
    });

    expect(childObject.get("foo")).toEqual("bar");
    expect(childObject.get("foo2")).toEqual("bar2");

    team.removeMember(readerID);

    expect(childObject.coValue.getCurrentReadKey()).not.toEqual(secondReadKey);

    childObject = childObject.edit((editable) => {
        editable.set("foo3", "bar3", "private");
        expect(editable.get("foo3")).toEqual("bar3");
    });

    const childContentAsReader2 = expectMap(childObject.coValue.testWithDifferentCredentials(
        reader2,
        newRandomSessionID(reader2ID)
    ).getCurrentContent());

    expect(childContentAsReader2.get("foo")).toEqual("bar");
    expect(childContentAsReader2.get("foo2")).toEqual("bar2");
    expect(childContentAsReader2.get("foo3")).toEqual("bar3");

    expect(() => childObject.coValue.testWithDifferentCredentials(
        reader,
        newRandomSessionID(readerID)
    ).getCurrentContent()).toThrow(/readKey (.+?) not revealed for (.+?)/);
});
