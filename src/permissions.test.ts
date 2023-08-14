import { newRandomSessionID } from "./coValue.js";
import { LocalNode } from "./node.js";
import { expectMap } from "./contentType.js";
import { expectTeamContent } from "./permissions.js";
import {
    createdNowUnique,
    getRecipientID,
    newRandomKeySecret,
    seal,
    encryptKeySecret,
} from "./crypto.js";
import {
    newTeam,
    newTeamHighLevel,
    teamWithTwoAdmins,
    teamWithTwoAdminsHighLevel,
} from "./testUtils.js";

test("Initial admin can add another admin to a team", () => {
    teamWithTwoAdmins();
});

test("Initial admin can add another admin to a team (high level)", () => {
    teamWithTwoAdminsHighLevel();
});

test("Added admin can add a third admin to a team", () => {
    const { team, otherAdmin, node } = teamWithTwoAdmins();

    const teamAsOtherAdmin = team.testWithDifferentAccount(
        otherAdmin,
        newRandomSessionID(otherAdmin.id)
    );

    let otherContent = expectTeamContent(teamAsOtherAdmin.getCurrentContent());

    expect(otherContent.get(otherAdmin.id)).toEqual("admin");

    const thirdAdmin = node.createAccount("thirdAdmin");

    otherContent.edit((editable) => {
        editable.set(thirdAdmin.id, "admin", "trusting");
        expect(editable.get(thirdAdmin.id)).toEqual("admin");
    });

    otherContent = expectTeamContent(teamAsOtherAdmin.getCurrentContent());

    expect(otherContent.get(thirdAdmin.id)).toEqual("admin");
});

test("Added adming can add a third admin to a team (high level)", () => {
    const { team, otherAdmin, node } = teamWithTwoAdminsHighLevel();

    const teamAsOtherAdmin = team.testWithDifferentAccount(
        otherAdmin,
        newRandomSessionID(otherAdmin.id)
    );

    const thirdAdmin = node.createAccount("thirdAdmin");

    teamAsOtherAdmin.addMember(thirdAdmin.id, "admin");

    expect(teamAsOtherAdmin.teamMap.get(thirdAdmin.id)).toEqual("admin");
});

test("Admins can't demote other admins in a team", () => {
    const { team, admin, otherAdmin } = teamWithTwoAdmins();

    let teamContent = expectTeamContent(team.getCurrentContent());

    teamContent.edit((editable) => {
        editable.set(otherAdmin.id, "writer", "trusting");
        expect(editable.get(otherAdmin.id)).toEqual("admin");
    });

    teamContent = expectTeamContent(team.getCurrentContent());
    expect(teamContent.get(otherAdmin.id)).toEqual("admin");

    const teamAsOtherAdmin = team.testWithDifferentAccount(
        otherAdmin,
        newRandomSessionID(otherAdmin.id)
    );

    let teamContentAsOtherAdmin = expectTeamContent(
        teamAsOtherAdmin.getCurrentContent()
    );

    teamContentAsOtherAdmin.edit((editable) => {
        editable.set(admin.id, "writer", "trusting");
        expect(editable.get(admin.id)).toEqual("admin");
    });

    teamContentAsOtherAdmin = expectTeamContent(
        teamAsOtherAdmin.getCurrentContent()
    );

    expect(teamContentAsOtherAdmin.get(admin.id)).toEqual("admin");
});

test("Admins can't demote other admins in a team (high level)", () => {
    const { team, admin, otherAdmin } = teamWithTwoAdminsHighLevel();

    const teamAsOtherAdmin = team.testWithDifferentAccount(
        otherAdmin,
        newRandomSessionID(otherAdmin.id)
    );

    expect(() => teamAsOtherAdmin.addMember(admin.id, "writer")).toThrow(
        "Failed to set role"
    );

    expect(teamAsOtherAdmin.teamMap.get(admin.id)).toEqual("admin");
});

test("Admins an add writers to a team, who can't add admins, writers, or readers", () => {
    const { team, node } = newTeam();
    const writer = node.createAccount("writer");

    let teamContent = expectTeamContent(team.getCurrentContent());

    teamContent.edit((editable) => {
        editable.set(writer.id, "writer", "trusting");
        expect(editable.get(writer.id)).toEqual("writer");
    });

    teamContent = expectTeamContent(team.getCurrentContent());
    expect(teamContent.get(writer.id)).toEqual("writer");

    const teamAsWriter = team.testWithDifferentAccount(
        writer,
        newRandomSessionID(writer.id)
    );

    let teamContentAsWriter = expectTeamContent(
        teamAsWriter.getCurrentContent()
    );

    expect(teamContentAsWriter.get(writer.id)).toEqual("writer");

    const otherAgent = node.createAccount("otherAgent");

    teamContentAsWriter.edit((editable) => {
        editable.set(otherAgent.id, "admin", "trusting");
        expect(editable.get(otherAgent.id)).toBeUndefined();

        editable.set(otherAgent.id, "writer", "trusting");
        expect(editable.get(otherAgent.id)).toBeUndefined();

        editable.set(otherAgent.id, "reader", "trusting");
        expect(editable.get(otherAgent.id)).toBeUndefined();
    });

    teamContentAsWriter = expectTeamContent(teamAsWriter.getCurrentContent());

    expect(teamContentAsWriter.get(otherAgent.id)).toBeUndefined();
});

test("Admins an add writers to a team, who can't add admins, writers, or readers (high level)", () => {
    const { team, node } = newTeamHighLevel();

    const writer = node.createAccount("writer");

    team.addMember(writer.id, "writer");
    expect(team.teamMap.get(writer.id)).toEqual("writer");

    const teamAsWriter = team.testWithDifferentAccount(
        writer,
        newRandomSessionID(writer.id)
    );

    expect(teamAsWriter.teamMap.get(writer.id)).toEqual("writer");

    const otherAgent = node.createAccount("otherAgent");

    expect(() => teamAsWriter.addMember(otherAgent.id, "admin")).toThrow(
        "Failed to set role"
    );
    expect(() => teamAsWriter.addMember(otherAgent.id, "writer")).toThrow(
        "Failed to set role"
    );
    expect(() => teamAsWriter.addMember(otherAgent.id, "reader")).toThrow(
        "Failed to set role"
    );

    expect(teamAsWriter.teamMap.get(otherAgent.id)).toBeUndefined();
});

test("Admins can add readers to a team, who can't add admins, writers, or readers", () => {
    const { team, node } = newTeam();
    const reader = node.createAccount("reader");

    let teamContent = expectTeamContent(team.getCurrentContent());

    teamContent.edit((editable) => {
        editable.set(reader.id, "reader", "trusting");
        expect(editable.get(reader.id)).toEqual("reader");
    });

    teamContent = expectTeamContent(team.getCurrentContent());
    expect(teamContent.get(reader.id)).toEqual("reader");

    const teamAsReader = team.testWithDifferentAccount(
        reader,
        newRandomSessionID(reader.id)
    );

    let teamContentAsReader = expectTeamContent(
        teamAsReader.getCurrentContent()
    );

    expect(teamContentAsReader.get(reader.id)).toEqual("reader");

    const otherAgent = node.createAccount("otherAgent");

    teamContentAsReader.edit((editable) => {
        editable.set(otherAgent.id, "admin", "trusting");
        expect(editable.get(otherAgent.id)).toBeUndefined();

        editable.set(otherAgent.id, "writer", "trusting");
        expect(editable.get(otherAgent.id)).toBeUndefined();

        editable.set(otherAgent.id, "reader", "trusting");
        expect(editable.get(otherAgent.id)).toBeUndefined();
    });

    teamContentAsReader = expectTeamContent(teamAsReader.getCurrentContent());

    expect(teamContentAsReader.get(otherAgent.id)).toBeUndefined();
});

test("Admins can add readers to a team, who can't add admins, writers, or readers (high level)", () => {
    const { team, node } = newTeamHighLevel();

    const reader = node.createAccount("reader");

    team.addMember(reader.id, "reader");
    expect(team.teamMap.get(reader.id)).toEqual("reader");

    const teamAsReader = team.testWithDifferentAccount(
        reader,
        newRandomSessionID(reader.id)
    );

    expect(teamAsReader.teamMap.get(reader.id)).toEqual("reader");

    const otherAgent = node.createAccount("otherAgent");

    expect(() => teamAsReader.addMember(otherAgent.id, "admin")).toThrow(
        "Failed to set role"
    );
    expect(() => teamAsReader.addMember(otherAgent.id, "writer")).toThrow(
        "Failed to set role"
    );
    expect(() => teamAsReader.addMember(otherAgent.id, "reader")).toThrow(
        "Failed to set role"
    );

    expect(teamAsReader.teamMap.get(otherAgent.id)).toBeUndefined();
});

test("Admins can write to an object that is owned by their team", () => {
    const { node, team } = newTeam();

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: team.id },
        meta: null,
        ...createdNowUnique(),
        publicNickname: "childObject",
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

    const writer = node.createAccount("writer");

    expectTeamContent(team.getCurrentContent()).edit((editable) => {
        editable.set(writer.id, "writer", "trusting");
        expect(editable.get(writer.id)).toEqual("writer");
    });

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: team.id },
        meta: null,
        ...createdNowUnique(),
        publicNickname: "childObject",
    });

    const childObjectAsWriter = childObject.testWithDifferentAccount(
        writer,
        newRandomSessionID(writer.id)
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

    const writer = node.createAccount("writer");

    team.addMember(writer.id, "writer");

    const childObject = team.createMap();

    let childObjectAsWriter = expectMap(
        childObject.coValue
            .testWithDifferentAccount(writer, newRandomSessionID(writer.id))
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

    const reader = node.createAccount("reader");

    expectTeamContent(team.getCurrentContent()).edit((editable) => {
        editable.set(reader.id, "reader", "trusting");
        expect(editable.get(reader.id)).toEqual("reader");
    });

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: team.id },
        meta: null,
        ...createdNowUnique(),
        publicNickname: "childObject",
    });

    const childObjectAsReader = childObject.testWithDifferentAccount(
        reader,
        newRandomSessionID(reader.id)
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

    const reader = node.createAccount("reader");

    team.addMember(reader.id, "reader");

    const childObject = team.createMap();

    let childObjectAsReader = expectMap(
        childObject.coValue
            .testWithDifferentAccount(reader, newRandomSessionID(reader.id))
            .getCurrentContent()
    );

    childObjectAsReader = childObjectAsReader.edit((editable) => {
        editable.set("foo", "bar", "trusting");
        expect(editable.get("foo")).toBeUndefined();
    });

    expect(childObjectAsReader.get("foo")).toBeUndefined();
});

test("Admins can set team read key and then use it to create and read private transactions in owned objects", () => {
    const { node, team, admin } = newTeam();

    const teamContent = expectTeamContent(team.getCurrentContent());

    teamContent.edit((editable) => {
        const { secret: readKey, id: readKeyID } = newRandomKeySecret();
        const revelation = seal(
            readKey,
            admin.currentRecipientSecret(),
            admin.currentRecipientID(),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${admin.id}`, revelation, "trusting");

        expect(editable.get(`${readKeyID}_for_${admin.id}`)).toEqual(
            revelation
        );

        editable.set("readKey", readKeyID, "trusting");

        expect(editable.get("readKey")).toEqual(readKeyID);

        expect(team.getCurrentReadKey().secret).toEqual(readKey);
    });

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: team.id },
        meta: null,
        ...createdNowUnique(),
        publicNickname: "childObject",
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

    const writer = node.createAccount("writer");

    const { secret: readKey, id: readKeyID } = newRandomKeySecret();

    const teamContent = expectTeamContent(team.getCurrentContent());

    teamContent.edit((editable) => {
        editable.set(writer.id, "writer", "trusting");
        expect(editable.get(writer.id)).toEqual("writer");

        const revelation1 = seal(
            readKey,
            admin.currentRecipientSecret(),
            admin.currentRecipientID(),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${admin.id}`, revelation1, "trusting");

        const revelation2 = seal(
            readKey,
            admin.currentRecipientSecret(),
            writer.currentRecipientID(),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${writer.id}`, revelation2, "trusting");

        editable.set("readKey", readKeyID, "trusting");
    });

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: team.id },
        meta: null,
        ...createdNowUnique(),
        publicNickname: "childObject",
    });

    const childObjectAsWriter = childObject.testWithDifferentAccount(
        writer,
        newRandomSessionID(writer.id)
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

    const writer = node.createAccount("writer");

    team.addMember(writer.id, "writer");

    const childObject = team.createMap();

    let childObjectAsWriter = expectMap(
        childObject.coValue
            .testWithDifferentAccount(writer, newRandomSessionID(writer.id))
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

    const reader = node.createAccount("reader");

    const { secret: readKey, id: readKeyID } = newRandomKeySecret();

    const teamContent = expectTeamContent(team.getCurrentContent());

    teamContent.edit((editable) => {
        editable.set(reader.id, "reader", "trusting");
        expect(editable.get(reader.id)).toEqual("reader");

        const revelation1 = seal(
            readKey,
            admin.currentRecipientSecret(),
            admin.currentRecipientID(),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${admin.id}`, revelation1, "trusting");

        const revelation2 = seal(
            readKey,
            admin.currentRecipientSecret(),
            reader.currentRecipientID(),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${reader.id}`, revelation2, "trusting");

        editable.set("readKey", readKeyID, "trusting");
    });

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: team.id },
        meta: null,
        ...createdNowUnique(),
        publicNickname: "childObject",
    });

    expectMap(childObject.getCurrentContent()).edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    const childObjectAsReader = childObject.testWithDifferentAccount(
        reader,
        newRandomSessionID(reader.id)
    );

    expect(childObjectAsReader.getCurrentReadKey().secret).toEqual(readKey);

    const childContentAsReader = expectMap(
        childObjectAsReader.getCurrentContent()
    );

    expect(childContentAsReader.get("foo")).toEqual("bar");
});

test("Admins can set team read key and then use it to create private transactions in owned objects, which readers can read (high level)", () => {
    const { node, team, admin } = newTeamHighLevel();

    const reader = node.createAccount("reader");

    team.addMember(reader.id, "reader");

    let childObject = team.createMap();

    childObject = childObject.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    const childContentAsReader = expectMap(
        childObject.coValue
            .testWithDifferentAccount(reader, newRandomSessionID(reader.id))
            .getCurrentContent()
    );

    expect(childContentAsReader.get("foo")).toEqual("bar");
});

test("Admins can set team read key and then use it to create private transactions in owned objects, which readers can read, even with a separate later revelation for the same read key", () => {
    const { node, team, admin } = newTeam();

    const reader1 = node.createAccount("reader1");

    const reader2 = node.createAccount("reader2");

    const { secret: readKey, id: readKeyID } = newRandomKeySecret();

    const teamContent = expectTeamContent(team.getCurrentContent());

    teamContent.edit((editable) => {
        editable.set(reader1.id, "reader", "trusting");
        expect(editable.get(reader1.id)).toEqual("reader");

        const revelation1 = seal(
            readKey,
            admin.currentRecipientSecret(),
            admin.currentRecipientID(),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${admin.id}`, revelation1, "trusting");

        const revelation2 = seal(
            readKey,
            admin.currentRecipientSecret(),
            reader1.currentRecipientID(),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${reader1.id}`, revelation2, "trusting");

        editable.set("readKey", readKeyID, "trusting");
    });

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: team.id },
        meta: null,
        ...createdNowUnique(),
        publicNickname: "childObject",
    });

    expectMap(childObject.getCurrentContent()).edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    const childObjectAsReader1 = childObject.testWithDifferentAccount(
        reader1,
        newRandomSessionID(reader1.id)
    );

    expect(childObjectAsReader1.getCurrentReadKey().secret).toEqual(readKey);

    const childContentAsReader1 = expectMap(
        childObjectAsReader1.getCurrentContent()
    );

    expect(childContentAsReader1.get("foo")).toEqual("bar");

    teamContent.edit((editable) => {
        const revelation3 = seal(
            readKey,
            admin.currentRecipientSecret(),
            reader2.currentRecipientID(),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${reader2.id}`, revelation3, "trusting");
    });

    const childObjectAsReader2 = childObject.testWithDifferentAccount(
        reader2,
        newRandomSessionID(reader2.id)
    );

    expect(childObjectAsReader2.getCurrentReadKey().secret).toEqual(readKey);

    const childContentAsReader2 = expectMap(
        childObjectAsReader2.getCurrentContent()
    );

    expect(childContentAsReader2.get("foo")).toEqual("bar");
});

test("Admins can set team read key and then use it to create private transactions in owned objects, which readers can read, even with a separate later revelation for the same read key (high level)", () => {
    const { node, team, admin } = newTeamHighLevel();

    const reader1 = node.createAccount("reader1");

    const reader2 = node.createAccount("reader2");

    team.addMember(reader1.id, "reader");

    let childObject = team.createMap();

    childObject = childObject.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    const childContentAsReader1 = expectMap(
        childObject.coValue
            .testWithDifferentAccount(reader1, newRandomSessionID(reader1.id))
            .getCurrentContent()
    );

    expect(childContentAsReader1.get("foo")).toEqual("bar");

    team.addMember(reader2.id, "reader");

    const childContentAsReader2 = expectMap(
        childObject.coValue
            .testWithDifferentAccount(reader2, newRandomSessionID(reader2.id))
            .getCurrentContent()
    );

    expect(childContentAsReader2.get("foo")).toEqual("bar");
});

test("Admins can set team read key, make a private transaction in an owned object, rotate the read key, make another private transaction, and both can be read by the admin", () => {
    const { node, team, admin } = newTeam();

    const teamContent = expectTeamContent(team.getCurrentContent());

    teamContent.edit((editable) => {
        const { secret: readKey, id: readKeyID } = newRandomKeySecret();
        const revelation = seal(
            readKey,
            admin.currentRecipientSecret(),
            admin.currentRecipientID(),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${admin.id}`, revelation, "trusting");

        editable.set("readKey", readKeyID, "trusting");
        expect(editable.get("readKey")).toEqual(readKeyID);
        expect(team.getCurrentReadKey().secret).toEqual(readKey);
    });

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: team.id },
        meta: null,
        ...createdNowUnique(),
        publicNickname: "childObject",
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
            admin.currentRecipientSecret(),
            admin.currentRecipientID(),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID2}_for_${admin.id}`, revelation, "trusting");

        editable.set("readKey", readKeyID2, "trusting");
        expect(editable.get("readKey")).toEqual(readKeyID2);
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
    const { team } = newTeamHighLevel();

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
    const { node, team, admin } = newTeam();

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: team.id },
        meta: null,
        ...createdNowUnique(),
        publicNickname: "childObject",
    });

    const teamContent = expectTeamContent(team.getCurrentContent());
    const { secret: readKey, id: readKeyID } = newRandomKeySecret();

    teamContent.edit((editable) => {
        const revelation = seal(
            readKey,
            admin.currentRecipientSecret(),
            admin.currentRecipientID(),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${admin.id}`, revelation, "trusting");

        editable.set("readKey", readKeyID, "trusting");
        expect(editable.get("readKey")).toEqual(readKeyID);
        expect(team.getCurrentReadKey().secret).toEqual(readKey);
    });

    let childContent = expectMap(childObject.getCurrentContent());

    childContent.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    childContent = expectMap(childObject.getCurrentContent());
    expect(childContent.get("foo")).toEqual("bar");

    const reader = node.createAccount("reader");

    const { secret: readKey2, id: readKeyID2 } = newRandomKeySecret();

    teamContent.edit((editable) => {
        const revelation2 = seal(
            readKey2,
            admin.currentRecipientSecret(),
            admin.currentRecipientID(),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID2}_for_${admin.id}`, revelation2, "trusting");

        const revelation3 = seal(
            readKey2,
            admin.currentRecipientSecret(),
            reader.currentRecipientID(),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID2}_for_${reader.id}`, revelation3, "trusting");

        editable.set(
            `${readKeyID}_for_${readKeyID2}`,
            encryptKeySecret({
                toEncrypt: { id: readKeyID, secret: readKey },
                encrypting: { id: readKeyID2, secret: readKey2 },
            }).encrypted,
            "trusting"
        );

        editable.set("readKey", readKeyID2, "trusting");

        expect(editable.get("readKey")).toEqual(readKeyID2);
        expect(team.getCurrentReadKey().secret).toEqual(readKey2);

        editable.set(reader.id, "reader", "trusting");
        expect(editable.get(reader.id)).toEqual("reader");
    });

    childContent.edit((editable) => {
        editable.set("foo2", "bar2", "private");
        expect(editable.get("foo2")).toEqual("bar2");
    });

    const childObjectAsReader = childObject.testWithDifferentAccount(
        reader,
        newRandomSessionID(reader.id)
    );

    expect(childObjectAsReader.getCurrentReadKey().secret).toEqual(readKey2);

    const childContentAsReader = expectMap(
        childObjectAsReader.getCurrentContent()
    );

    expect(childContentAsReader.get("foo")).toEqual("bar");
    expect(childContentAsReader.get("foo2")).toEqual("bar2");
});

test("Admins can set team read key, make a private transaction in an owned object, rotate the read key, add a reader, make another private transaction in the owned object, and both can be read by the reader (high level)", () => {
    const { node, team } = newTeamHighLevel();

    let childObject = team.createMap();

    const firstReadKey = childObject.coValue.getCurrentReadKey();

    childObject = childObject.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    expect(childObject.get("foo")).toEqual("bar");

    team.rotateReadKey();

    expect(childObject.coValue.getCurrentReadKey()).not.toEqual(firstReadKey);

    const reader = node.createAccount("reader");

    team.addMember(reader.id, "reader");

    childObject = childObject.edit((editable) => {
        editable.set("foo2", "bar2", "private");
        expect(editable.get("foo2")).toEqual("bar2");
    });

    const childContentAsReader = expectMap(
        childObject.coValue
            .testWithDifferentAccount(reader, newRandomSessionID(reader.id))
            .getCurrentContent()
    );

    expect(childContentAsReader.get("foo")).toEqual("bar");
    expect(childContentAsReader.get("foo2")).toEqual("bar2");
});

test("Admins can set team read rey, make a private transaction in an owned object, rotate the read key, add two readers, rotate the read key again to kick out one reader, make another private transaction in the owned object, and only the remaining reader can read both transactions", () => {
    const { node, team, admin } = newTeam();

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: team.id },
        meta: null,
        ...createdNowUnique(),
        publicNickname: "childObject",
    });

    const teamContent = expectTeamContent(team.getCurrentContent());
    const { secret: readKey, id: readKeyID } = newRandomKeySecret();
    const reader = node.createAccount("reader");

    const reader2 = node.createAccount("reader2");

    teamContent.edit((editable) => {
        const revelation1 = seal(
            readKey,
            admin.currentRecipientSecret(),
            admin.currentRecipientID(),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${admin.id}`, revelation1, "trusting");

        const revelation2 = seal(
            readKey,
            admin.currentRecipientSecret(),
            reader.currentRecipientID(),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${reader.id}`, revelation2, "trusting");

        const revelation3 = seal(
            readKey,
            admin.currentRecipientSecret(),
            reader2.currentRecipientID(),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${reader2.id}`, revelation3, "trusting");

        editable.set("readKey", readKeyID, "trusting");
        expect(editable.get("readKey")).toEqual(readKeyID);
        expect(team.getCurrentReadKey().secret).toEqual(readKey);

        editable.set(reader.id, "reader", "trusting");
        expect(editable.get(reader.id)).toEqual("reader");
        editable.set(reader2.id, "reader", "trusting");
        expect(editable.get(reader2.id)).toEqual("reader");
    });

    let childContent = expectMap(childObject.getCurrentContent());

    childContent.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    childContent = expectMap(childObject.getCurrentContent());
    expect(childContent.get("foo")).toEqual("bar");

    let childObjectAsReader = childObject.testWithDifferentAccount(
        reader,
        newRandomSessionID(reader.id)
    );

    expect(
        expectMap(childObjectAsReader.getCurrentContent()).get("foo")
    ).toEqual("bar");

    let childObjectAsReader2 = childObject.testWithDifferentAccount(
        reader,
        newRandomSessionID(reader.id)
    );

    expect(
        expectMap(childObjectAsReader2.getCurrentContent()).get("foo")
    ).toEqual("bar");

    const { secret: readKey2, id: readKeyID2 } = newRandomKeySecret();

    teamContent.edit((editable) => {
        const newRevelation1 = seal(
            readKey2,
            admin.currentRecipientSecret(),
            admin.currentRecipientID(),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );

        editable.set(
            `${readKeyID2}_for_${admin.id}`,
            newRevelation1,
            "trusting"
        );

        const newRevelation2 = seal(
            readKey2,
            admin.currentRecipientSecret(),
            reader2.currentRecipientID(),
            {
                in: team.id,
                tx: team.nextTransactionID(),
            }
        );

        editable.set(
            `${readKeyID2}_for_${reader2.id}`,
            newRevelation2,
            "trusting"
        );

        editable.set("readKey", readKeyID2, "trusting");
        expect(editable.get("readKey")).toEqual(readKeyID2);
        expect(team.getCurrentReadKey().secret).toEqual(readKey2);

        editable.set(reader.id, "revoked", "trusting");
        // expect(editable.get(reader.id)).toEqual("revoked");
    });

    expect(childObject.getCurrentReadKey().secret).toEqual(readKey2);

    childContent = expectMap(childObject.getCurrentContent());
    childContent.edit((editable) => {
        editable.set("foo2", "bar2", "private");
        expect(editable.get("foo2")).toEqual("bar2");
    });

    // TODO: make sure these instances of coValues sync between each other so this isn't necessary?
    childObjectAsReader = childObject.testWithDifferentAccount(
        reader,
        newRandomSessionID(reader.id)
    );
    childObjectAsReader2 = childObject.testWithDifferentAccount(
        reader2,
        newRandomSessionID(reader2.id)
    );

    expect(
        expectMap(childObjectAsReader.getCurrentContent()).get("foo2")
    ).toBeUndefined();
    expect(
        expectMap(childObjectAsReader2.getCurrentContent()).get("foo2")
    ).toEqual("bar2");
});

test("Admins can set team read rey, make a private transaction in an owned object, rotate the read key, add two readers, rotate the read key again to kick out one reader, make another private transaction in the owned object, and only the remaining reader can read both transactions (high level)", () => {
    const { node, team } = newTeamHighLevel();

    let childObject = team.createMap();

    childObject = childObject.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    expect(childObject.get("foo")).toEqual("bar");

    team.rotateReadKey();

    const secondReadKey = childObject.coValue.getCurrentReadKey();

    const reader = node.createAccount("reader");

    const reader2 = node.createAccount("reader2");

    team.addMember(reader.id, "reader");
    team.addMember(reader2.id, "reader");

    childObject = childObject.edit((editable) => {
        editable.set("foo2", "bar2", "private");
        expect(editable.get("foo2")).toEqual("bar2");
    });

    expect(childObject.get("foo")).toEqual("bar");
    expect(childObject.get("foo2")).toEqual("bar2");

    team.removeMember(reader.id);

    expect(childObject.coValue.getCurrentReadKey()).not.toEqual(secondReadKey);

    childObject = childObject.edit((editable) => {
        editable.set("foo3", "bar3", "private");
        expect(editable.get("foo3")).toEqual("bar3");
    });

    const childContentAsReader2 = expectMap(
        childObject.coValue
            .testWithDifferentAccount(reader2, newRandomSessionID(reader2.id))
            .getCurrentContent()
    );

    expect(childContentAsReader2.get("foo")).toEqual("bar");
    expect(childContentAsReader2.get("foo2")).toEqual("bar2");
    expect(childContentAsReader2.get("foo3")).toEqual("bar3");

    expect(
        expectMap(
            childObject.coValue
                .testWithDifferentAccount(reader, newRandomSessionID(reader.id))
                .getCurrentContent()
        ).get("foo3")
    ).toBeUndefined();
});

test("Can create two owned objects in the same team and they will have different ids", () => {
    const { node, team } = newTeam();

    const childObject1 = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: team.id },
        meta: null,
        ...createdNowUnique(),
    });

    const childObject2 = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByTeam", team: team.id },
        meta: null,
        ...createdNowUnique(),
    });

    expect(childObject1.id).not.toEqual(childObject2.id);
});
