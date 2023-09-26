import { newRandomSessionID } from "../coValueCore.js";
import { expectMap } from "../coValue.js";
import { Group, expectGroup } from "../coValues/group.js";
import {
    createdNowUnique,
    newRandomKeySecret,
    seal,
    encryptKeySecret,
    newRandomAgentSecret,
    getAgentID,
    getAgentSealerSecret,
    getAgentSealerID,
} from "../crypto.js";
import {
    newGroup,
    newGroupHighLevel,
    groupWithTwoAdmins,
    groupWithTwoAdminsHighLevel,
} from "./testUtils.js";
import { AnonymousControlledAccount, cojsonReady } from "../index.js";

beforeEach(async () => {
    await cojsonReady;
});

test("Initial admin can add another admin to a group", () => {
    groupWithTwoAdmins();
});

test("Initial admin can add another admin to a group (high level)", () => {
    groupWithTwoAdminsHighLevel();
});

test("Added admin can add a third admin to a group", () => {
    const { groupCore, otherAdmin, node } = groupWithTwoAdmins();

    let groupAsOtherAdmin = expectGroup(groupCore.testWithDifferentAccount(
        otherAdmin,
        newRandomSessionID(otherAdmin.id)
    ).getCurrentContent());

    expect(groupAsOtherAdmin.get(otherAdmin.id)).toEqual("admin");

    const thirdAdmin = node.createAccount("thirdAdmin");

    groupAsOtherAdmin = groupAsOtherAdmin.edit((editable) => {
        editable.set(thirdAdmin.id, "admin", "trusting");
        expect(editable.get(thirdAdmin.id)).toEqual("admin");
    });

    expect(groupAsOtherAdmin.get(thirdAdmin.id)).toEqual("admin");
});

test("Added adming can add a third admin to a group (high level)", () => {
    const { group, otherAdmin, node } = groupWithTwoAdminsHighLevel();

    let groupAsOtherAdmin = expectGroup(group.core.testWithDifferentAccount(
        otherAdmin,
        newRandomSessionID(otherAdmin.id)
    ).getCurrentContent());

    const thirdAdmin = groupAsOtherAdmin.core.node.createAccount("thirdAdmin");

    groupAsOtherAdmin = groupAsOtherAdmin.addMember(thirdAdmin.id, "admin");

    expect(groupAsOtherAdmin.get(thirdAdmin.id)).toEqual("admin");
});

test("Admins can't demote other admins in a group", () => {
    const { groupCore, admin, otherAdmin } = groupWithTwoAdmins();

    let groupContent = expectGroup(groupCore.getCurrentContent());

    groupContent = groupContent.edit((editable) => {
        editable.set(otherAdmin.id, "writer", "trusting");
        expect(editable.get(otherAdmin.id)).toEqual("admin");
    });

    expect(groupContent.get(otherAdmin.id)).toEqual("admin");

    let groupAsOtherAdmin = expectGroup(groupCore.testWithDifferentAccount(
        otherAdmin,
        newRandomSessionID(otherAdmin.id)
    ).getCurrentContent());

    groupAsOtherAdmin = groupAsOtherAdmin.edit((editable) => {
        editable.set(admin.id, "writer", "trusting");
        expect(editable.get(admin.id)).toEqual("admin");
    });

    expect(groupAsOtherAdmin.get(admin.id)).toEqual("admin");
});

test("Admins can't demote other admins in a group (high level)", () => {
    const { group, admin, otherAdmin } = groupWithTwoAdminsHighLevel();

    const groupAsOtherAdmin = expectGroup(group.core.testWithDifferentAccount(
        otherAdmin,
        newRandomSessionID(otherAdmin.id)
    ).getCurrentContent());

    expect(() =>
        groupAsOtherAdmin.addMemberInternal(admin.id, "writer")
    ).toThrow("Failed to set role");

    expect(groupAsOtherAdmin.get(admin.id)).toEqual("admin");
});

test("Admins an add writers to a group, who can't add admins, writers, or readers", () => {
    const { groupCore, node } = newGroup();
    const writer = node.createAccount("writer");

    let groupContent = expectGroup(groupCore.getCurrentContent());

    groupContent.edit((editable) => {
        editable.set(writer.id, "writer", "trusting");
        expect(editable.get(writer.id)).toEqual("writer");
    });

    groupContent = expectGroup(groupCore.getCurrentContent());
    expect(groupContent.get(writer.id)).toEqual("writer");

    let groupAsWriter = expectGroup(groupCore.testWithDifferentAccount(
        writer,
        newRandomSessionID(writer.id)
    ).getCurrentContent());


    expect(groupAsWriter.get(writer.id)).toEqual("writer");

    const otherAgent = node.createAccount("otherAgent");

    groupAsWriter = groupAsWriter.edit((editable) => {
        editable.set(otherAgent.id, "admin", "trusting");
        expect(editable.get(otherAgent.id)).toBeUndefined();

        editable.set(otherAgent.id, "writer", "trusting");
        expect(editable.get(otherAgent.id)).toBeUndefined();

        editable.set(otherAgent.id, "reader", "trusting");
        expect(editable.get(otherAgent.id)).toBeUndefined();
    });

    expect(groupAsWriter.get(otherAgent.id)).toBeUndefined();
});

test("Admins an add writers to a group, who can't add admins, writers, or readers (high level)", () => {
    let { group, node } = newGroupHighLevel();

    const writer = node.createAccount("writer");

    group = group.addMember(writer.id, "writer");
    expect(group.get(writer.id)).toEqual("writer");

    const groupAsWriter = expectGroup(group.core.testWithDifferentAccount(
        writer,
        newRandomSessionID(writer.id)
    ).getCurrentContent());

    expect(groupAsWriter.get(writer.id)).toEqual("writer");

    const otherAgent = groupAsWriter.core.node.createAccount("otherAgent");

    expect(() => groupAsWriter.addMember(otherAgent.id, "admin")).toThrow(
        "Failed to set role"
    );
    expect(() => groupAsWriter.addMember(otherAgent.id, "writer")).toThrow(
        "Failed to set role"
    );
    expect(() => groupAsWriter.addMember(otherAgent.id, "reader")).toThrow(
        "Failed to set role"
    );

    expect(groupAsWriter.get(otherAgent.id)).toBeUndefined();
});

test("Admins can add readers to a group, who can't add admins, writers, or readers", () => {
    const { groupCore, node } = newGroup();
    const reader = node.createAccount("reader");

    let groupContent = expectGroup(groupCore.getCurrentContent());

    groupContent.edit((editable) => {
        editable.set(reader.id, "reader", "trusting");
        expect(editable.get(reader.id)).toEqual("reader");
    });

    groupContent = expectGroup(groupCore.getCurrentContent());
    expect(groupContent.get(reader.id)).toEqual("reader");

    let groupAsReader = expectGroup(groupCore.testWithDifferentAccount(
        reader,
        newRandomSessionID(reader.id)
    ).getCurrentContent());

    expect(groupAsReader.get(reader.id)).toEqual("reader");

    const otherAgent = node.createAccount("otherAgent");

    groupAsReader = groupAsReader.edit((editable) => {
        editable.set(otherAgent.id, "admin", "trusting");
        expect(editable.get(otherAgent.id)).toBeUndefined();

        editable.set(otherAgent.id, "writer", "trusting");
        expect(editable.get(otherAgent.id)).toBeUndefined();

        editable.set(otherAgent.id, "reader", "trusting");
        expect(editable.get(otherAgent.id)).toBeUndefined();
    });

    expect(groupAsReader.get(otherAgent.id)).toBeUndefined();
});

test("Admins can add readers to a group, who can't add admins, writers, or readers (high level)", () => {
    let { group, node } = newGroupHighLevel();

    const reader = node.createAccount("reader");

    group = group.addMember(reader.id, "reader");
    expect(group.get(reader.id)).toEqual("reader");

    const groupAsReader = expectGroup(group.core.testWithDifferentAccount(
        reader,
        newRandomSessionID(reader.id)
    ).getCurrentContent());

    expect(groupAsReader.get(reader.id)).toEqual("reader");

    const otherAgent = groupAsReader.core.node.createAccount("otherAgent");

    expect(() => groupAsReader.addMember(otherAgent.id, "admin")).toThrow(
        "Failed to set role"
    );
    expect(() => groupAsReader.addMember(otherAgent.id, "writer")).toThrow(
        "Failed to set role"
    );
    expect(() => groupAsReader.addMember(otherAgent.id, "reader")).toThrow(
        "Failed to set role"
    );

    expect(groupAsReader.get(otherAgent.id)).toBeUndefined();
});

test("Admins can write to an object that is owned by their group", () => {
    const { node, groupCore } = newGroup();

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByGroup", group: groupCore.id },
        meta: null,
        ...createdNowUnique(),
    });

    let childContent = expectMap(childObject.getCurrentContent());

    childContent.edit((editable) => {
        editable.set("foo", "bar", "trusting");
        expect(editable.get("foo")).toEqual("bar");
    });

    childContent = expectMap(childObject.getCurrentContent());

    expect(childContent.get("foo")).toEqual("bar");
});

test("Admins can write to an object that is owned by their group (high level)", () => {
    const { node, group } = newGroupHighLevel();

    let childObject = group.createMap();

    childObject = childObject.edit((editable) => {
        editable.set("foo", "bar", "trusting");
        expect(editable.get("foo")).toEqual("bar");
    });

    expect(childObject.get("foo")).toEqual("bar");
});

test("Writers can write to an object that is owned by their group", () => {
    const { node, groupCore } = newGroup();

    const writer = node.createAccount("writer");

    expectGroup(groupCore.getCurrentContent()).edit((editable) => {
        editable.set(writer.id, "writer", "trusting");
        expect(editable.get(writer.id)).toEqual("writer");
    });

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByGroup", group: groupCore.id },
        meta: null,
        ...createdNowUnique(),
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

test("Writers can write to an object that is owned by their group (high level)", () => {
    const { node, group } = newGroupHighLevel();

    const writer = node.createAccount("writer");

    group.addMember(writer.id, "writer");

    const childObject = group.createMap();

    let childObjectAsWriter = expectMap(
        childObject.core
            .testWithDifferentAccount(writer, newRandomSessionID(writer.id))
            .getCurrentContent()
    );

    childObjectAsWriter = childObjectAsWriter.edit((editable) => {
        editable.set("foo", "bar", "trusting");
        expect(editable.get("foo")).toEqual("bar");
    });

    expect(childObjectAsWriter.get("foo")).toEqual("bar");
});

test("Readers can not write to an object that is owned by their group", () => {
    const { node, groupCore } = newGroup();

    const reader = node.createAccount("reader");

    expectGroup(groupCore.getCurrentContent()).edit((editable) => {
        editable.set(reader.id, "reader", "trusting");
        expect(editable.get(reader.id)).toEqual("reader");
    });

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByGroup", group: groupCore.id },
        meta: null,
        ...createdNowUnique(),
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

test("Readers can not write to an object that is owned by their group (high level)", () => {
    const { node, group } = newGroupHighLevel();

    const reader = node.createAccount("reader");

    group.addMember(reader.id, "reader");

    const childObject = group.createMap();

    let childObjectAsReader = expectMap(
        childObject.core
            .testWithDifferentAccount(reader, newRandomSessionID(reader.id))
            .getCurrentContent()
    );

    childObjectAsReader = childObjectAsReader.edit((editable) => {
        editable.set("foo", "bar", "trusting");
        expect(editable.get("foo")).toBeUndefined();
    });

    expect(childObjectAsReader.get("foo")).toBeUndefined();
});

test("Admins can set group read key and then use it to create and read private transactions in owned objects", () => {
    const { node, groupCore, admin } = newGroup();

    const groupContent = expectGroup(groupCore.getCurrentContent());

    groupContent.edit((editable) => {
        const { secret: readKey, id: readKeyID } = newRandomKeySecret();
        const revelation = seal({
            message: readKey,
            from: admin.currentSealerSecret(),
            to: admin.currentSealerID(),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(`${readKeyID}_for_${admin.id}`, revelation, "trusting");

        expect(editable.get(`${readKeyID}_for_${admin.id}`)).toEqual(
            revelation
        );

        editable.set("readKey", readKeyID, "trusting");

        expect(editable.get("readKey")).toEqual(readKeyID);

        expect(groupCore.getCurrentReadKey().secret).toEqual(readKey);
    });

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByGroup", group: groupCore.id },
        meta: null,
        ...createdNowUnique(),
    });

    let childContent = expectMap(childObject.getCurrentContent());

    childContent.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    childContent = expectMap(childObject.getCurrentContent());
    expect(childContent.get("foo")).toEqual("bar");
});

test("Admins can set group read key and then use it to create and read private transactions in owned objects (high level)", () => {
    const { node, group, admin } = newGroupHighLevel();

    let childObject = group.createMap();

    childObject = childObject.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    expect(childObject.get("foo")).toEqual("bar");
});

test("Admins can set group read key and then writers can use it to create and read private transactions in owned objects", () => {
    const { node, groupCore, admin } = newGroup();

    const writer = node.createAccount("writer");

    const { secret: readKey, id: readKeyID } = newRandomKeySecret();

    const groupContent = expectGroup(groupCore.getCurrentContent());

    groupContent.edit((editable) => {
        editable.set(writer.id, "writer", "trusting");
        expect(editable.get(writer.id)).toEqual("writer");

        const revelation1 = seal({
            message: readKey,
            from: admin.currentSealerSecret(),
            to: admin.currentSealerID(),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(`${readKeyID}_for_${admin.id}`, revelation1, "trusting");

        const revelation2 = seal({
            message: readKey,
            from: admin.currentSealerSecret(),
            to: writer.currentSealerID(),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(`${readKeyID}_for_${writer.id}`, revelation2, "trusting");

        editable.set("readKey", readKeyID, "trusting");
    });

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByGroup", group: groupCore.id },
        meta: null,
        ...createdNowUnique(),
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

test("Admins can set group read key and then writers can use it to create and read private transactions in owned objects (high level)", () => {
    const { node, group, admin } = newGroupHighLevel();

    const writer = node.createAccount("writer");

    group.addMember(writer.id, "writer");

    const childObject = group.createMap();

    let childObjectAsWriter = expectMap(
        childObject.core
            .testWithDifferentAccount(writer, newRandomSessionID(writer.id))
            .getCurrentContent()
    );

    childObjectAsWriter = childObjectAsWriter.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    expect(childObjectAsWriter.get("foo")).toEqual("bar");
});

test("Admins can set group read key and then use it to create private transactions in owned objects, which readers can read", () => {
    const { node, groupCore, admin } = newGroup();

    const reader = node.createAccount("reader");

    const { secret: readKey, id: readKeyID } = newRandomKeySecret();

    const groupContent = expectGroup(groupCore.getCurrentContent());

    groupContent.edit((editable) => {
        editable.set(reader.id, "reader", "trusting");
        expect(editable.get(reader.id)).toEqual("reader");

        const revelation1 = seal({
            message: readKey,
            from: admin.currentSealerSecret(),
            to: admin.currentSealerID(),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(`${readKeyID}_for_${admin.id}`, revelation1, "trusting");

        const revelation2 = seal({
            message: readKey,
            from: admin.currentSealerSecret(),
            to: reader.currentSealerID(),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(`${readKeyID}_for_${reader.id}`, revelation2, "trusting");

        editable.set("readKey", readKeyID, "trusting");
    });

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByGroup", group: groupCore.id },
        meta: null,
        ...createdNowUnique(),
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

test("Admins can set group read key and then use it to create private transactions in owned objects, which readers can read (high level)", () => {
    const { node, group, admin } = newGroupHighLevel();

    const reader = node.createAccount("reader");

    group.addMember(reader.id, "reader");

    let childObject = group.createMap();

    childObject = childObject.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    const childContentAsReader = expectMap(
        childObject.core
            .testWithDifferentAccount(reader, newRandomSessionID(reader.id))
            .getCurrentContent()
    );

    expect(childContentAsReader.get("foo")).toEqual("bar");
});

test("Admins can set group read key and then use it to create private transactions in owned objects, which readers can read, even with a separate later revelation for the same read key", () => {
    const { node, groupCore, admin } = newGroup();

    const reader1 = node.createAccount("reader1");

    const reader2 = node.createAccount("reader2");

    const { secret: readKey, id: readKeyID } = newRandomKeySecret();

    const groupContent = expectGroup(groupCore.getCurrentContent());

    groupContent.edit((editable) => {
        editable.set(reader1.id, "reader", "trusting");
        expect(editable.get(reader1.id)).toEqual("reader");

        const revelation1 = seal({
            message: readKey,
            from: admin.currentSealerSecret(),
            to: admin.currentSealerID(),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(`${readKeyID}_for_${admin.id}`, revelation1, "trusting");

        const revelation2 = seal({
            message: readKey,
            from: admin.currentSealerSecret(),
            to: reader1.currentSealerID(),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(`${readKeyID}_for_${reader1.id}`, revelation2, "trusting");

        editable.set("readKey", readKeyID, "trusting");
    });

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByGroup", group: groupCore.id },
        meta: null,
        ...createdNowUnique(),
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

    groupContent.edit((editable) => {
        const revelation3 = seal({
            message: readKey,
            from: admin.currentSealerSecret(),
            to: reader2.currentSealerID(),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

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

test("Admins can set group read key and then use it to create private transactions in owned objects, which readers can read, even with a separate later revelation for the same read key (high level)", () => {
    const { node, group, admin } = newGroupHighLevel();

    const reader1 = node.createAccount("reader1");

    const reader2 = node.createAccount("reader2");

    group.addMember(reader1.id, "reader");

    let childObject = group.createMap();

    childObject = childObject.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    const childContentAsReader1 = expectMap(
        childObject.core
            .testWithDifferentAccount(reader1, newRandomSessionID(reader1.id))
            .getCurrentContent()
    );

    expect(childContentAsReader1.get("foo")).toEqual("bar");

    group.addMember(reader2.id, "reader");

    const childContentAsReader2 = expectMap(
        childObject.core
            .testWithDifferentAccount(reader2, newRandomSessionID(reader2.id))
            .getCurrentContent()
    );

    expect(childContentAsReader2.get("foo")).toEqual("bar");
});

test("Admins can set group read key, make a private transaction in an owned object, rotate the read key, make another private transaction, and both can be read by the admin", () => {
    const { node, groupCore, admin } = newGroup();

    const groupContent = expectGroup(groupCore.getCurrentContent());

    groupContent.edit((editable) => {
        const { secret: readKey, id: readKeyID } = newRandomKeySecret();
        const revelation = seal({
            message: readKey,
            from: admin.currentSealerSecret(),
            to: admin.currentSealerID(),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(`${readKeyID}_for_${admin.id}`, revelation, "trusting");

        editable.set("readKey", readKeyID, "trusting");
        expect(editable.get("readKey")).toEqual(readKeyID);
        expect(groupCore.getCurrentReadKey().secret).toEqual(readKey);
    });

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByGroup", group: groupCore.id },
        meta: null,
        ...createdNowUnique(),
    });

    let childContent = expectMap(childObject.getCurrentContent());

    childContent.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    childContent = expectMap(childObject.getCurrentContent());
    expect(childContent.get("foo")).toEqual("bar");

    groupContent.edit((editable) => {
        const { secret: readKey2, id: readKeyID2 } = newRandomKeySecret();

        const revelation = seal({
            message: readKey2,
            from: admin.currentSealerSecret(),
            to: admin.currentSealerID(),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(`${readKeyID2}_for_${admin.id}`, revelation, "trusting");

        editable.set("readKey", readKeyID2, "trusting");
        expect(editable.get("readKey")).toEqual(readKeyID2);
        expect(groupCore.getCurrentReadKey().secret).toEqual(readKey2);
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

test("Admins can set group read key, make a private transaction in an owned object, rotate the read key, make another private transaction, and both can be read by the admin (high level)", () => {
    const { group } = newGroupHighLevel();

    let childObject = group.createMap();

    const firstReadKey = childObject.core.getCurrentReadKey();

    childObject = childObject.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    expect(childObject.get("foo")).toEqual("bar");

    group.rotateReadKey();

    expect(childObject.core.getCurrentReadKey()).not.toEqual(firstReadKey);

    childObject = childObject.edit((editable) => {
        editable.set("foo2", "bar2", "private");
        expect(editable.get("foo2")).toEqual("bar2");
    });

    expect(childObject.get("foo")).toEqual("bar");
    expect(childObject.get("foo2")).toEqual("bar2");
});

test("Admins can set group read key, make a private transaction in an owned object, rotate the read key, add a reader, make another private transaction in the owned object, and both can be read by the reader", () => {
    const { node, groupCore, admin } = newGroup();

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByGroup", group: groupCore.id },
        meta: null,
        ...createdNowUnique(),
    });

    const groupContent = expectGroup(groupCore.getCurrentContent());
    const { secret: readKey, id: readKeyID } = newRandomKeySecret();

    groupContent.edit((editable) => {
        const revelation = seal({
            message: readKey,
            from: admin.currentSealerSecret(),
            to: admin.currentSealerID(),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(`${readKeyID}_for_${admin.id}`, revelation, "trusting");

        editable.set("readKey", readKeyID, "trusting");
        expect(editable.get("readKey")).toEqual(readKeyID);
        expect(groupCore.getCurrentReadKey().secret).toEqual(readKey);
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

    groupContent.edit((editable) => {
        const revelation2 = seal({
            message: readKey2,
            from: admin.currentSealerSecret(),
            to: admin.currentSealerID(),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(`${readKeyID2}_for_${admin.id}`, revelation2, "trusting");

        const revelation3 = seal({
            message: readKey2,
            from: admin.currentSealerSecret(),
            to: reader.currentSealerID(),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

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
        expect(groupCore.getCurrentReadKey().secret).toEqual(readKey2);

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

test("Admins can set group read key, make a private transaction in an owned object, rotate the read key, add a reader, make another private transaction in the owned object, and both can be read by the reader (high level)", () => {
    const { node, group } = newGroupHighLevel();

    let childObject = group.createMap();

    const firstReadKey = childObject.core.getCurrentReadKey();

    childObject = childObject.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    expect(childObject.get("foo")).toEqual("bar");

    group.rotateReadKey();

    expect(childObject.core.getCurrentReadKey()).not.toEqual(firstReadKey);

    const reader = node.createAccount("reader");

    group.addMember(reader.id, "reader");

    childObject = childObject.edit((editable) => {
        editable.set("foo2", "bar2", "private");
        expect(editable.get("foo2")).toEqual("bar2");
    });

    const childContentAsReader = expectMap(
        childObject.core
            .testWithDifferentAccount(reader, newRandomSessionID(reader.id))
            .getCurrentContent()
    );

    expect(childContentAsReader.get("foo")).toEqual("bar");
    expect(childContentAsReader.get("foo2")).toEqual("bar2");
});

test("Admins can set group read rey, make a private transaction in an owned object, rotate the read key, add two readers, rotate the read key again to kick out one reader, make another private transaction in the owned object, and only the remaining reader can read both transactions", () => {
    const { node, groupCore, admin } = newGroup();

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByGroup", group: groupCore.id },
        meta: null,
        ...createdNowUnique(),
    });

    const groupContent = expectGroup(groupCore.getCurrentContent());
    const { secret: readKey, id: readKeyID } = newRandomKeySecret();
    const reader = node.createAccount("reader");

    const reader2 = node.createAccount("reader2");

    groupContent.edit((editable) => {
        const revelation1 = seal({
            message: readKey,
            from: admin.currentSealerSecret(),
            to: admin.currentSealerID(),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(`${readKeyID}_for_${admin.id}`, revelation1, "trusting");

        const revelation2 = seal({
            message: readKey,
            from: admin.currentSealerSecret(),
            to: reader.currentSealerID(),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(`${readKeyID}_for_${reader.id}`, revelation2, "trusting");

        const revelation3 = seal({
            message: readKey,
            from: admin.currentSealerSecret(),
            to: reader2.currentSealerID(),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(`${readKeyID}_for_${reader2.id}`, revelation3, "trusting");

        editable.set("readKey", readKeyID, "trusting");
        expect(editable.get("readKey")).toEqual(readKeyID);
        expect(groupCore.getCurrentReadKey().secret).toEqual(readKey);

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

    groupContent.edit((editable) => {
        const newRevelation1 = seal({
            message: readKey2,
            from: admin.currentSealerSecret(),
            to: admin.currentSealerID(),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(
            `${readKeyID2}_for_${admin.id}`,
            newRevelation1,
            "trusting"
        );

        const newRevelation2 = seal({
            message: readKey2,
            from: admin.currentSealerSecret(),
            to: reader2.currentSealerID(),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(
            `${readKeyID2}_for_${reader2.id}`,
            newRevelation2,
            "trusting"
        );

        editable.set("readKey", readKeyID2, "trusting");
        expect(editable.get("readKey")).toEqual(readKeyID2);
        expect(groupCore.getCurrentReadKey().secret).toEqual(readKey2);

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

test("Admins can set group read rey, make a private transaction in an owned object, rotate the read key, add two readers, rotate the read key again to kick out one reader, make another private transaction in the owned object, and only the remaining reader can read both transactions (high level)", () => {
    const { node, group } = newGroupHighLevel();

    let childObject = group.createMap();

    childObject = childObject.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    expect(childObject.get("foo")).toEqual("bar");

    group.rotateReadKey();

    const secondReadKey = childObject.core.getCurrentReadKey();

    const reader = node.createAccount("reader");

    const reader2 = node.createAccount("reader2");

    group.addMember(reader.id, "reader");
    group.addMember(reader2.id, "reader");

    childObject = childObject.edit((editable) => {
        editable.set("foo2", "bar2", "private");
        expect(editable.get("foo2")).toEqual("bar2");
    });

    expect(childObject.get("foo")).toEqual("bar");
    expect(childObject.get("foo2")).toEqual("bar2");

    group.removeMember(reader.id);

    expect(childObject.core.getCurrentReadKey()).not.toEqual(secondReadKey);

    childObject = childObject.edit((editable) => {
        editable.set("foo3", "bar3", "private");
        expect(editable.get("foo3")).toEqual("bar3");
    });

    const childContentAsReader2 = expectMap(
        childObject.core
            .testWithDifferentAccount(reader2, newRandomSessionID(reader2.id))
            .getCurrentContent()
    );

    expect(childContentAsReader2.get("foo")).toEqual("bar");
    expect(childContentAsReader2.get("foo2")).toEqual("bar2");
    expect(childContentAsReader2.get("foo3")).toEqual("bar3");

    expect(
        expectMap(
            childObject.core
                .testWithDifferentAccount(reader, newRandomSessionID(reader.id))
                .getCurrentContent()
        ).get("foo3")
    ).toBeUndefined();
});

test("Can create two owned objects in the same group and they will have different ids", () => {
    const { node, groupCore } = newGroup();

    const childObject1 = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByGroup", group: groupCore.id },
        meta: null,
        ...createdNowUnique(),
    });

    const childObject2 = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByGroup", group: groupCore.id },
        meta: null,
        ...createdNowUnique(),
    });

    expect(childObject1.id).not.toEqual(childObject2.id);
});

test("Admins can create an adminInvite, which can add an admin", () => {
    const { node, groupCore, admin } = newGroup();

    const inviteSecret = newRandomAgentSecret();
    const inviteID = getAgentID(inviteSecret);

    expectGroup(groupCore.getCurrentContent()).edit((editable) => {
        const { secret: readKey, id: readKeyID } = newRandomKeySecret();
        const revelation = seal({
            message: readKey,
            from: admin.currentSealerSecret(),
            to: admin.currentSealerID(),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(`${readKeyID}_for_${admin.id}`, revelation, "trusting");
        editable.set("readKey", readKeyID, "trusting");

        editable.set(inviteID, "adminInvite", "trusting");

        expect(editable.get(inviteID)).toEqual("adminInvite");

        const revelationForInvite = seal({
            message: readKey,
            from: admin.currentSealerSecret(),
            to: getAgentSealerID(inviteID),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(
            `${readKeyID}_for_${inviteID}`,
            revelationForInvite,
            "trusting"
        );
    });

    const groupAsInvite = expectGroup(groupCore.testWithDifferentAccount(
        new AnonymousControlledAccount(inviteSecret),
        newRandomSessionID(inviteID)
    ).getCurrentContent());

    const invitedAdminSecret = newRandomAgentSecret();
    const invitedAdminID = getAgentID(invitedAdminSecret);

    groupAsInvite.edit((editable) => {
        editable.set(invitedAdminID, "admin", "trusting");

        expect(editable.get(invitedAdminID)).toEqual("admin");

        const readKey = groupAsInvite.core.getCurrentReadKey();

        expect(readKey.secret).toBeDefined();

        const revelation = seal({
            message: readKey.secret!,
            from: getAgentSealerSecret(invitedAdminSecret),
            to: getAgentSealerID(invitedAdminID),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(
            `${readKey.id}_for_${invitedAdminID}`,
            revelation,
            "trusting"
        );

        expect(editable.get(`${readKey.id}_for_${invitedAdminID}`)).toEqual(
            revelation
        );
    });
});

test("Admins can create an adminInvite, which can add an admin (high-level)", async () => {
    const { node, group, admin } = newGroupHighLevel();

    const inviteSecret = group.createInvite("admin");

    const invitedAdminSecret = newRandomAgentSecret();
    const invitedAdminID = getAgentID(invitedAdminSecret);

    const nodeAsInvitedAdmin = node.testWithDifferentAccount(
        new AnonymousControlledAccount(invitedAdminSecret),
        newRandomSessionID(invitedAdminID)
    );

    await nodeAsInvitedAdmin.acceptInvite(group.id, inviteSecret);

    const thirdAdmin = newRandomAgentSecret();
    const thirdAdminID = getAgentID(thirdAdmin);

    let groupAsInvitedAdmin = await nodeAsInvitedAdmin.load(group.id);

    expect(groupAsInvitedAdmin.get(invitedAdminID)).toEqual(
        "admin"
    );
    expect(
        groupAsInvitedAdmin.core.getCurrentReadKey().secret
    ).toBeDefined();

    groupAsInvitedAdmin = groupAsInvitedAdmin.addMemberInternal(thirdAdminID, "admin");

    expect(groupAsInvitedAdmin.get(thirdAdminID)).toEqual(
        "admin"
    );
});

test("Admins can create a writerInvite, which can add a writer", () => {
    const { node, groupCore, admin } = newGroup();

    const inviteSecret = newRandomAgentSecret();
    const inviteID = getAgentID(inviteSecret);

    expectGroup(groupCore.getCurrentContent()).edit((editable) => {
        const { secret: readKey, id: readKeyID } = newRandomKeySecret();
        const revelation = seal({
            message: readKey,
            from: admin.currentSealerSecret(),
            to: admin.currentSealerID(),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(`${readKeyID}_for_${admin.id}`, revelation, "trusting");
        editable.set("readKey", readKeyID, "trusting");

        editable.set(inviteID, "writerInvite", "trusting");

        expect(editable.get(inviteID)).toEqual("writerInvite");

        const revelationForInvite = seal({
            message: readKey,
            from: admin.currentSealerSecret(),
            to: getAgentSealerID(inviteID),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(
            `${readKeyID}_for_${inviteID}`,
            revelationForInvite,
            "trusting"
        );
    });

    const groupAsInvite = expectGroup(groupCore.testWithDifferentAccount(
        new AnonymousControlledAccount(inviteSecret),
        newRandomSessionID(inviteID)
    ).getCurrentContent());

    const invitedWriterSecret = newRandomAgentSecret();
    const invitedWriterID = getAgentID(invitedWriterSecret);

    groupAsInvite.edit((editable) => {
        editable.set(invitedWriterID, "writer", "trusting");

        expect(editable.get(invitedWriterID)).toEqual("writer");

        const readKey = groupAsInvite.core.getCurrentReadKey();

        expect(readKey.secret).toBeDefined();

        const revelation = seal({
            message: readKey.secret!,
            from: getAgentSealerSecret(invitedWriterSecret),
            to: getAgentSealerID(invitedWriterID),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(
            `${readKey.id}_for_${invitedWriterID}`,
            revelation,
            "trusting"
        );

        expect(editable.get(`${readKey.id}_for_${invitedWriterID}`)).toEqual(
            revelation
        );
    });
});

test("Admins can create a writerInvite, which can add a writer (high-level)", async () => {
    const { node, group, admin } = newGroupHighLevel();

    const inviteSecret = group.createInvite("writer");

    const invitedWriterSecret = newRandomAgentSecret();
    const invitedWriterID = getAgentID(invitedWriterSecret);

    const nodeAsInvitedWriter = node.testWithDifferentAccount(
        new AnonymousControlledAccount(invitedWriterSecret),
        newRandomSessionID(invitedWriterID)
    );

    await nodeAsInvitedWriter.acceptInvite(group.id, inviteSecret);

    const groupAsInvitedWriter = await nodeAsInvitedWriter.load(group.id);

    expect(groupAsInvitedWriter.get(invitedWriterID)).toEqual(
        "writer"
    );
    expect(
        groupAsInvitedWriter.core.getCurrentReadKey().secret
    ).toBeDefined();
});

test("Admins can create a readerInvite, which can add a reader", () => {
    const { node, groupCore, admin } = newGroup();

    const inviteSecret = newRandomAgentSecret();
    const inviteID = getAgentID(inviteSecret);

    expectGroup(groupCore.getCurrentContent()).edit((editable) => {
        const { secret: readKey, id: readKeyID } = newRandomKeySecret();
        const revelation = seal({
            message: readKey,
            from: admin.currentSealerSecret(),
            to: admin.currentSealerID(),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(`${readKeyID}_for_${admin.id}`, revelation, "trusting");
        editable.set("readKey", readKeyID, "trusting");

        editable.set(inviteID, "readerInvite", "trusting");

        expect(editable.get(inviteID)).toEqual("readerInvite");

        const revelationForInvite = seal({
            message: readKey,
            from: admin.currentSealerSecret(),
            to: getAgentSealerID(inviteID),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(
            `${readKeyID}_for_${inviteID}`,
            revelationForInvite,
            "trusting"
        );
    });

    const groupAsInvite = expectGroup(groupCore.testWithDifferentAccount(
        new AnonymousControlledAccount(inviteSecret),
        newRandomSessionID(inviteID)
    ).getCurrentContent());

    const invitedReaderSecret = newRandomAgentSecret();
    const invitedReaderID = getAgentID(invitedReaderSecret);

    groupAsInvite.edit((editable) => {
        editable.set(invitedReaderID, "reader", "trusting");

        expect(editable.get(invitedReaderID)).toEqual("reader");

        const readKey = groupAsInvite.core.getCurrentReadKey();

        expect(readKey.secret).toBeDefined();

        const revelation = seal({
            message: readKey.secret!,
            from: getAgentSealerSecret(invitedReaderSecret),
            to: getAgentSealerID(invitedReaderID),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(
            `${readKey.id}_for_${invitedReaderID}`,
            revelation,
            "trusting"
        );

        expect(editable.get(`${readKey.id}_for_${invitedReaderID}`)).toEqual(
            revelation
        );
    });
});

test("Admins can create a readerInvite, which can add a reader (high-level)", async () => {
    const { node, group, admin } = newGroupHighLevel();

    const inviteSecret = group.createInvite("reader");

    const invitedReaderSecret = newRandomAgentSecret();
    const invitedReaderID = getAgentID(invitedReaderSecret);

    const nodeAsInvitedReader = node.testWithDifferentAccount(
        new AnonymousControlledAccount(invitedReaderSecret),
        newRandomSessionID(invitedReaderID)
    );

    await nodeAsInvitedReader.acceptInvite(group.id, inviteSecret);

    const groupAsInvitedReader =
        await nodeAsInvitedReader.load(group.id);

    expect(groupAsInvitedReader.get(invitedReaderID)).toEqual(
        "reader"
    );
    expect(
        groupAsInvitedReader.core.getCurrentReadKey().secret
    ).toBeDefined();
});

test("WriterInvites can not invite admins", () => {
    const { node, groupCore, admin } = newGroup();

    const inviteSecret = newRandomAgentSecret();
    const inviteID = getAgentID(inviteSecret);

    expectGroup(groupCore.getCurrentContent()).edit((editable) => {
        const { secret: readKey, id: readKeyID } = newRandomKeySecret();
        const revelation = seal({
            message: readKey,
            from: admin.currentSealerSecret(),
            to: admin.currentSealerID(),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(`${readKeyID}_for_${admin.id}`, revelation, "trusting");
        editable.set("readKey", readKeyID, "trusting");

        editable.set(inviteID, "writerInvite", "trusting");

        expect(editable.get(inviteID)).toEqual("writerInvite");

        const revelationForInvite = seal({
            message: readKey,
            from: admin.currentSealerSecret(),
            to: getAgentSealerID(inviteID),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(
            `${readKeyID}_for_${inviteID}`,
            revelationForInvite,
            "trusting"
        );
    });

    const groupAsInvite = expectGroup(groupCore.testWithDifferentAccount(
        new AnonymousControlledAccount(inviteSecret),
        newRandomSessionID(inviteID)
    ).getCurrentContent());

    const invitedAdminSecret = newRandomAgentSecret();
    const invitedAdminID = getAgentID(invitedAdminSecret);

    groupAsInvite.edit((editable) => {
        editable.set(invitedAdminID, "admin", "trusting");
        expect(editable.get(invitedAdminID)).toBeUndefined();
    });
});

test("ReaderInvites can not invite admins", () => {
    const { node, groupCore, admin } = newGroup();

    const inviteSecret = newRandomAgentSecret();
    const inviteID = getAgentID(inviteSecret);

    expectGroup(groupCore.getCurrentContent()).edit((editable) => {
        const { secret: readKey, id: readKeyID } = newRandomKeySecret();
        const revelation = seal({
            message: readKey,
            from: admin.currentSealerSecret(),
            to: admin.currentSealerID(),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(`${readKeyID}_for_${admin.id}`, revelation, "trusting");
        editable.set("readKey", readKeyID, "trusting");

        editable.set(inviteID, "readerInvite", "trusting");

        expect(editable.get(inviteID)).toEqual("readerInvite");

        const revelationForInvite = seal({
            message: readKey,
            from: admin.currentSealerSecret(),
            to: getAgentSealerID(inviteID),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(
            `${readKeyID}_for_${inviteID}`,
            revelationForInvite,
            "trusting"
        );
    });

    const groupAsInvite = expectGroup(groupCore.testWithDifferentAccount(
        new AnonymousControlledAccount(inviteSecret),
        newRandomSessionID(inviteID)
    ).getCurrentContent());

    const invitedAdminSecret = newRandomAgentSecret();
    const invitedAdminID = getAgentID(invitedAdminSecret);

    groupAsInvite.edit((editable) => {
        editable.set(invitedAdminID, "admin", "trusting");
        expect(editable.get(invitedAdminID)).toBeUndefined();
    });
});

test("ReaderInvites can not invite writers", () => {
    const { node, groupCore, admin } = newGroup();

    const inviteSecret = newRandomAgentSecret();
    const inviteID = getAgentID(inviteSecret);

    expectGroup(groupCore.getCurrentContent()).edit((editable) => {
        const { secret: readKey, id: readKeyID } = newRandomKeySecret();
        const revelation = seal({
            message: readKey,
            from: admin.currentSealerSecret(),
            to: admin.currentSealerID(),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(`${readKeyID}_for_${admin.id}`, revelation, "trusting");
        editable.set("readKey", readKeyID, "trusting");

        editable.set(inviteID, "readerInvite", "trusting");

        expect(editable.get(inviteID)).toEqual("readerInvite");

        const revelationForInvite = seal({
            message: readKey,
            from: admin.currentSealerSecret(),
            to: getAgentSealerID(inviteID),
            nOnceMaterial: {
                in: groupCore.id,
                tx: groupCore.nextTransactionID(),
            },
        });

        editable.set(
            `${readKeyID}_for_${inviteID}`,
            revelationForInvite,
            "trusting"
        );
    });

    const groupAsInvite = expectGroup(groupCore.testWithDifferentAccount(
        new AnonymousControlledAccount(inviteSecret),
        newRandomSessionID(inviteID)
    ).getCurrentContent());

    const invitedWriterSecret = newRandomAgentSecret();
    const invitedWriterID = getAgentID(invitedWriterSecret);

    groupAsInvite.edit((editable) => {
        editable.set(invitedWriterID, "writer", "trusting");
        expect(editable.get(invitedWriterID)).toBeUndefined();
    });
});

test("Can give read permission to 'everyone'", () => {
    const { node, groupCore } = newGroup();

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByGroup", group: groupCore.id },
        meta: null,
        ...createdNowUnique(),
    });

    expectGroup(groupCore.getCurrentContent()).edit((editable) => {
        const { secret: readKey, id: readKeyID } = newRandomKeySecret();
        editable.set("everyone", "reader", "trusting");
        editable.set("readKey", readKeyID, "trusting");
        editable.set(`${readKeyID}_for_everyone`, readKey, "trusting");
    });

    const childContent = expectMap(childObject.getCurrentContent());

    expect(childContent.get("foo")).toBeUndefined();

    childContent.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    const newAccount = new AnonymousControlledAccount(newRandomAgentSecret());

    const childContent2 = expectMap(
        childObject
            .testWithDifferentAccount(
                newAccount,
                newRandomSessionID(newAccount.currentAgentID())
            )
            .getCurrentContent()
    );

    expect(childContent2.get("foo")).toEqual("bar");
});

test("Can give read permissions to 'everyone' (high-level)", async () => {
    const { group } = newGroupHighLevel();

    const childObject = group.createMap();

    expect(childObject.get("foo")).toBeUndefined();

    group.addMember("everyone", "reader");

    childObject.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    const newAccount = new AnonymousControlledAccount(newRandomAgentSecret());

    const childContent2 = expectMap(
        childObject.core
            .testWithDifferentAccount(
                new AnonymousControlledAccount(newRandomAgentSecret()),
                newRandomSessionID(newAccount.currentAgentID())
            )
            .getCurrentContent()
    );

    expect(childContent2.get("foo")).toEqual("bar");
});

test("Can give write permission to 'everyone'", () => {
    const { node, groupCore } = newGroup();

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByGroup", group: groupCore.id },
        meta: null,
        ...createdNowUnique(),
    });

    expectGroup(groupCore.getCurrentContent()).edit((editable) => {
        const { secret: readKey, id: readKeyID } = newRandomKeySecret();
        editable.set("everyone", "writer", "trusting");
        editable.set("readKey", readKeyID, "trusting");
        editable.set(`${readKeyID}_for_everyone`, readKey, "trusting");
    });

    const childContent = expectMap(childObject.getCurrentContent());

    expect(childContent.get("foo")).toBeUndefined();

    childContent.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    const newAccount = new AnonymousControlledAccount(newRandomAgentSecret());

    const childContent2 = expectMap(
        childObject
            .testWithDifferentAccount(
                newAccount,
                newRandomSessionID(newAccount.currentAgentID())
            )
            .getCurrentContent()
    );

    expect(childContent2.get("foo")).toEqual("bar");

    childContent2.edit((editable) => {
        editable.set("foo", "bar2", "private");
        expect(editable.get("foo")).toEqual("bar2");
    });
});

test("Can give write permissions to 'everyone' (high-level)", async () => {
    const { group } = newGroupHighLevel();

    const childObject = group.createMap();

    expect(childObject.get("foo")).toBeUndefined();

    group.addMember("everyone", "writer");

    childObject.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    const newAccount = new AnonymousControlledAccount(newRandomAgentSecret());

    const childContent2 = expectMap(
        childObject.core
            .testWithDifferentAccount(
                newAccount,
                newRandomSessionID(newAccount.currentAgentID())
            )
            .getCurrentContent()
    );

    expect(childContent2.get("foo")).toEqual("bar");

    childContent2.edit((editable) => {
        console.log("Before anon set")
        editable.set("foo", "bar2", "private");
        expect(editable.get("foo")).toEqual("bar2");
    });
});