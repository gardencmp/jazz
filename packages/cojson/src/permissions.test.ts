import { newRandomSessionID } from "./coValue.js";
import { expectMap } from "./contentType.js";
import { Group, expectGroupContent } from "./group.js";
import {
    createdNowUnique,
    newRandomKeySecret,
    seal,
    encryptKeySecret,
    newRandomAgentSecret,
    getAgentID,
    getAgentSealerSecret,
    getAgentSealerID,
} from "./crypto.js";
import {
    newGroup,
    newGroupHighLevel,
    groupWithTwoAdmins,
    groupWithTwoAdminsHighLevel,
} from "./testUtils.js";
import { AnonymousControlledAccount } from "./index.js";

test("Initial admin can add another admin to a group", () => {
    groupWithTwoAdmins();
});

test("Initial admin can add another admin to a group (high level)", () => {
    groupWithTwoAdminsHighLevel();
});

test("Added admin can add a third admin to a group", () => {
    const { group, otherAdmin, node } = groupWithTwoAdmins();

    const groupAsOtherAdmin = group.testWithDifferentAccount(
        otherAdmin,
        newRandomSessionID(otherAdmin.id)
    );

    let otherContent = expectGroupContent(groupAsOtherAdmin.getCurrentContent());

    expect(otherContent.get(otherAdmin.id)).toEqual("admin");

    const thirdAdmin = node.createAccount("thirdAdmin");

    otherContent.edit((editable) => {
        editable.set(thirdAdmin.id, "admin", "trusting");
        expect(editable.get(thirdAdmin.id)).toEqual("admin");
    });

    otherContent = expectGroupContent(groupAsOtherAdmin.getCurrentContent());

    expect(otherContent.get(thirdAdmin.id)).toEqual("admin");
});

test("Added adming can add a third admin to a group (high level)", () => {
    const { group, otherAdmin, node } = groupWithTwoAdminsHighLevel();

    const groupAsOtherAdmin = group.testWithDifferentAccount(
        otherAdmin,
        newRandomSessionID(otherAdmin.id)
    );

    const thirdAdmin = node.createAccount("thirdAdmin");

    groupAsOtherAdmin.addMember(thirdAdmin.id, "admin");

    expect(groupAsOtherAdmin.groupMap.get(thirdAdmin.id)).toEqual("admin");
});

test("Admins can't demote other admins in a group", () => {
    const { group, admin, otherAdmin } = groupWithTwoAdmins();

    let groupContent = expectGroupContent(group.getCurrentContent());

    groupContent.edit((editable) => {
        editable.set(otherAdmin.id, "writer", "trusting");
        expect(editable.get(otherAdmin.id)).toEqual("admin");
    });

    groupContent = expectGroupContent(group.getCurrentContent());
    expect(groupContent.get(otherAdmin.id)).toEqual("admin");

    const groupAsOtherAdmin = group.testWithDifferentAccount(
        otherAdmin,
        newRandomSessionID(otherAdmin.id)
    );

    let groupContentAsOtherAdmin = expectGroupContent(
        groupAsOtherAdmin.getCurrentContent()
    );

    groupContentAsOtherAdmin.edit((editable) => {
        editable.set(admin.id, "writer", "trusting");
        expect(editable.get(admin.id)).toEqual("admin");
    });

    groupContentAsOtherAdmin = expectGroupContent(
        groupAsOtherAdmin.getCurrentContent()
    );

    expect(groupContentAsOtherAdmin.get(admin.id)).toEqual("admin");
});

test("Admins can't demote other admins in a group (high level)", () => {
    const { group, admin, otherAdmin } = groupWithTwoAdminsHighLevel();

    const groupAsOtherAdmin = group.testWithDifferentAccount(
        otherAdmin,
        newRandomSessionID(otherAdmin.id)
    );

    expect(() => groupAsOtherAdmin.addMember(admin.id, "writer")).toThrow(
        "Failed to set role"
    );

    expect(groupAsOtherAdmin.groupMap.get(admin.id)).toEqual("admin");
});

test("Admins an add writers to a group, who can't add admins, writers, or readers", () => {
    const { group, node } = newGroup();
    const writer = node.createAccount("writer");

    let groupContent = expectGroupContent(group.getCurrentContent());

    groupContent.edit((editable) => {
        editable.set(writer.id, "writer", "trusting");
        expect(editable.get(writer.id)).toEqual("writer");
    });

    groupContent = expectGroupContent(group.getCurrentContent());
    expect(groupContent.get(writer.id)).toEqual("writer");

    const groupAsWriter = group.testWithDifferentAccount(
        writer,
        newRandomSessionID(writer.id)
    );

    let groupContentAsWriter = expectGroupContent(
        groupAsWriter.getCurrentContent()
    );

    expect(groupContentAsWriter.get(writer.id)).toEqual("writer");

    const otherAgent = node.createAccount("otherAgent");

    groupContentAsWriter.edit((editable) => {
        editable.set(otherAgent.id, "admin", "trusting");
        expect(editable.get(otherAgent.id)).toBeUndefined();

        editable.set(otherAgent.id, "writer", "trusting");
        expect(editable.get(otherAgent.id)).toBeUndefined();

        editable.set(otherAgent.id, "reader", "trusting");
        expect(editable.get(otherAgent.id)).toBeUndefined();
    });

    groupContentAsWriter = expectGroupContent(groupAsWriter.getCurrentContent());

    expect(groupContentAsWriter.get(otherAgent.id)).toBeUndefined();
});

test("Admins an add writers to a group, who can't add admins, writers, or readers (high level)", () => {
    const { group, node } = newGroupHighLevel();

    const writer = node.createAccount("writer");

    group.addMember(writer.id, "writer");
    expect(group.groupMap.get(writer.id)).toEqual("writer");

    const groupAsWriter = group.testWithDifferentAccount(
        writer,
        newRandomSessionID(writer.id)
    );

    expect(groupAsWriter.groupMap.get(writer.id)).toEqual("writer");

    const otherAgent = node.createAccount("otherAgent");

    expect(() => groupAsWriter.addMember(otherAgent.id, "admin")).toThrow(
        "Failed to set role"
    );
    expect(() => groupAsWriter.addMember(otherAgent.id, "writer")).toThrow(
        "Failed to set role"
    );
    expect(() => groupAsWriter.addMember(otherAgent.id, "reader")).toThrow(
        "Failed to set role"
    );

    expect(groupAsWriter.groupMap.get(otherAgent.id)).toBeUndefined();
});

test("Admins can add readers to a group, who can't add admins, writers, or readers", () => {
    const { group, node } = newGroup();
    const reader = node.createAccount("reader");

    let groupContent = expectGroupContent(group.getCurrentContent());

    groupContent.edit((editable) => {
        editable.set(reader.id, "reader", "trusting");
        expect(editable.get(reader.id)).toEqual("reader");
    });

    groupContent = expectGroupContent(group.getCurrentContent());
    expect(groupContent.get(reader.id)).toEqual("reader");

    const groupAsReader = group.testWithDifferentAccount(
        reader,
        newRandomSessionID(reader.id)
    );

    let groupContentAsReader = expectGroupContent(
        groupAsReader.getCurrentContent()
    );

    expect(groupContentAsReader.get(reader.id)).toEqual("reader");

    const otherAgent = node.createAccount("otherAgent");

    groupContentAsReader.edit((editable) => {
        editable.set(otherAgent.id, "admin", "trusting");
        expect(editable.get(otherAgent.id)).toBeUndefined();

        editable.set(otherAgent.id, "writer", "trusting");
        expect(editable.get(otherAgent.id)).toBeUndefined();

        editable.set(otherAgent.id, "reader", "trusting");
        expect(editable.get(otherAgent.id)).toBeUndefined();
    });

    groupContentAsReader = expectGroupContent(groupAsReader.getCurrentContent());

    expect(groupContentAsReader.get(otherAgent.id)).toBeUndefined();
});

test("Admins can add readers to a group, who can't add admins, writers, or readers (high level)", () => {
    const { group, node } = newGroupHighLevel();

    const reader = node.createAccount("reader");

    group.addMember(reader.id, "reader");
    expect(group.groupMap.get(reader.id)).toEqual("reader");

    const groupAsReader = group.testWithDifferentAccount(
        reader,
        newRandomSessionID(reader.id)
    );

    expect(groupAsReader.groupMap.get(reader.id)).toEqual("reader");

    const otherAgent = node.createAccount("otherAgent");

    expect(() => groupAsReader.addMember(otherAgent.id, "admin")).toThrow(
        "Failed to set role"
    );
    expect(() => groupAsReader.addMember(otherAgent.id, "writer")).toThrow(
        "Failed to set role"
    );
    expect(() => groupAsReader.addMember(otherAgent.id, "reader")).toThrow(
        "Failed to set role"
    );

    expect(groupAsReader.groupMap.get(otherAgent.id)).toBeUndefined();
});

test("Admins can write to an object that is owned by their group", () => {
    const { node, group } = newGroup();

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByGroup", group: group.id },
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
    const { node, group } = newGroup();

    const writer = node.createAccount("writer");

    expectGroupContent(group.getCurrentContent()).edit((editable) => {
        editable.set(writer.id, "writer", "trusting");
        expect(editable.get(writer.id)).toEqual("writer");
    });

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByGroup", group: group.id },
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

test("Readers can not write to an object that is owned by their group", () => {
    const { node, group } = newGroup();

    const reader = node.createAccount("reader");

    expectGroupContent(group.getCurrentContent()).edit((editable) => {
        editable.set(reader.id, "reader", "trusting");
        expect(editable.get(reader.id)).toEqual("reader");
    });

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByGroup", group: group.id },
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

test("Admins can set group read key and then use it to create and read private transactions in owned objects", () => {
    const { node, group, admin } = newGroup();

    const groupContent = expectGroupContent(group.getCurrentContent());

    groupContent.edit((editable) => {
        const { secret: readKey, id: readKeyID } = newRandomKeySecret();
        const revelation = seal(
            readKey,
            admin.currentSealerSecret(),
            admin.currentSealerID(),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${admin.id}`, revelation, "trusting");

        expect(editable.get(`${readKeyID}_for_${admin.id}`)).toEqual(
            revelation
        );

        editable.set("readKey", readKeyID, "trusting");

        expect(editable.get("readKey")).toEqual(readKeyID);

        expect(group.getCurrentReadKey().secret).toEqual(readKey);
    });

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByGroup", group: group.id },
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
    const { node, group, admin } = newGroup();

    const writer = node.createAccount("writer");

    const { secret: readKey, id: readKeyID } = newRandomKeySecret();

    const groupContent = expectGroupContent(group.getCurrentContent());

    groupContent.edit((editable) => {
        editable.set(writer.id, "writer", "trusting");
        expect(editable.get(writer.id)).toEqual("writer");

        const revelation1 = seal(
            readKey,
            admin.currentSealerSecret(),
            admin.currentSealerID(),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${admin.id}`, revelation1, "trusting");

        const revelation2 = seal(
            readKey,
            admin.currentSealerSecret(),
            writer.currentSealerID(),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${writer.id}`, revelation2, "trusting");

        editable.set("readKey", readKeyID, "trusting");
    });

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByGroup", group: group.id },
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

test("Admins can set group read key and then use it to create private transactions in owned objects, which readers can read", () => {
    const { node, group, admin } = newGroup();

    const reader = node.createAccount("reader");

    const { secret: readKey, id: readKeyID } = newRandomKeySecret();

    const groupContent = expectGroupContent(group.getCurrentContent());

    groupContent.edit((editable) => {
        editable.set(reader.id, "reader", "trusting");
        expect(editable.get(reader.id)).toEqual("reader");

        const revelation1 = seal(
            readKey,
            admin.currentSealerSecret(),
            admin.currentSealerID(),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${admin.id}`, revelation1, "trusting");

        const revelation2 = seal(
            readKey,
            admin.currentSealerSecret(),
            reader.currentSealerID(),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${reader.id}`, revelation2, "trusting");

        editable.set("readKey", readKeyID, "trusting");
    });

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByGroup", group: group.id },
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
        childObject.coValue
            .testWithDifferentAccount(reader, newRandomSessionID(reader.id))
            .getCurrentContent()
    );

    expect(childContentAsReader.get("foo")).toEqual("bar");
});

test("Admins can set group read key and then use it to create private transactions in owned objects, which readers can read, even with a separate later revelation for the same read key", () => {
    const { node, group, admin } = newGroup();

    const reader1 = node.createAccount("reader1");

    const reader2 = node.createAccount("reader2");

    const { secret: readKey, id: readKeyID } = newRandomKeySecret();

    const groupContent = expectGroupContent(group.getCurrentContent());

    groupContent.edit((editable) => {
        editable.set(reader1.id, "reader", "trusting");
        expect(editable.get(reader1.id)).toEqual("reader");

        const revelation1 = seal(
            readKey,
            admin.currentSealerSecret(),
            admin.currentSealerID(),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${admin.id}`, revelation1, "trusting");

        const revelation2 = seal(
            readKey,
            admin.currentSealerSecret(),
            reader1.currentSealerID(),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${reader1.id}`, revelation2, "trusting");

        editable.set("readKey", readKeyID, "trusting");
    });

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByGroup", group: group.id },
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
        const revelation3 = seal(
            readKey,
            admin.currentSealerSecret(),
            reader2.currentSealerID(),
            {
                in: group.id,
                tx: group.nextTransactionID(),
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
        childObject.coValue
            .testWithDifferentAccount(reader1, newRandomSessionID(reader1.id))
            .getCurrentContent()
    );

    expect(childContentAsReader1.get("foo")).toEqual("bar");

    group.addMember(reader2.id, "reader");

    const childContentAsReader2 = expectMap(
        childObject.coValue
            .testWithDifferentAccount(reader2, newRandomSessionID(reader2.id))
            .getCurrentContent()
    );

    expect(childContentAsReader2.get("foo")).toEqual("bar");
});

test("Admins can set group read key, make a private transaction in an owned object, rotate the read key, make another private transaction, and both can be read by the admin", () => {
    const { node, group, admin } = newGroup();

    const groupContent = expectGroupContent(group.getCurrentContent());

    groupContent.edit((editable) => {
        const { secret: readKey, id: readKeyID } = newRandomKeySecret();
        const revelation = seal(
            readKey,
            admin.currentSealerSecret(),
            admin.currentSealerID(),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${admin.id}`, revelation, "trusting");

        editable.set("readKey", readKeyID, "trusting");
        expect(editable.get("readKey")).toEqual(readKeyID);
        expect(group.getCurrentReadKey().secret).toEqual(readKey);
    });

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByGroup", group: group.id },
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

        const revelation = seal(
            readKey2,
            admin.currentSealerSecret(),
            admin.currentSealerID(),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID2}_for_${admin.id}`, revelation, "trusting");

        editable.set("readKey", readKeyID2, "trusting");
        expect(editable.get("readKey")).toEqual(readKeyID2);
        expect(group.getCurrentReadKey().secret).toEqual(readKey2);
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

    const firstReadKey = childObject.coValue.getCurrentReadKey();

    childObject = childObject.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    expect(childObject.get("foo")).toEqual("bar");

    group.rotateReadKey();

    expect(childObject.coValue.getCurrentReadKey()).not.toEqual(firstReadKey);

    childObject = childObject.edit((editable) => {
        editable.set("foo2", "bar2", "private");
        expect(editable.get("foo2")).toEqual("bar2");
    });

    expect(childObject.get("foo")).toEqual("bar");
    expect(childObject.get("foo2")).toEqual("bar2");
});

test("Admins can set group read key, make a private transaction in an owned object, rotate the read key, add a reader, make another private transaction in the owned object, and both can be read by the reader", () => {
    const { node, group, admin } = newGroup();

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByGroup", group: group.id },
        meta: null,
        ...createdNowUnique(),
    });

    const groupContent = expectGroupContent(group.getCurrentContent());
    const { secret: readKey, id: readKeyID } = newRandomKeySecret();

    groupContent.edit((editable) => {
        const revelation = seal(
            readKey,
            admin.currentSealerSecret(),
            admin.currentSealerID(),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${admin.id}`, revelation, "trusting");

        editable.set("readKey", readKeyID, "trusting");
        expect(editable.get("readKey")).toEqual(readKeyID);
        expect(group.getCurrentReadKey().secret).toEqual(readKey);
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
        const revelation2 = seal(
            readKey2,
            admin.currentSealerSecret(),
            admin.currentSealerID(),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID2}_for_${admin.id}`, revelation2, "trusting");

        const revelation3 = seal(
            readKey2,
            admin.currentSealerSecret(),
            reader.currentSealerID(),
            {
                in: group.id,
                tx: group.nextTransactionID(),
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
        expect(group.getCurrentReadKey().secret).toEqual(readKey2);

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

    const firstReadKey = childObject.coValue.getCurrentReadKey();

    childObject = childObject.edit((editable) => {
        editable.set("foo", "bar", "private");
        expect(editable.get("foo")).toEqual("bar");
    });

    expect(childObject.get("foo")).toEqual("bar");

    group.rotateReadKey();

    expect(childObject.coValue.getCurrentReadKey()).not.toEqual(firstReadKey);

    const reader = node.createAccount("reader");

    group.addMember(reader.id, "reader");

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

test("Admins can set group read rey, make a private transaction in an owned object, rotate the read key, add two readers, rotate the read key again to kick out one reader, make another private transaction in the owned object, and only the remaining reader can read both transactions", () => {
    const { node, group, admin } = newGroup();

    const childObject = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByGroup", group: group.id },
        meta: null,
        ...createdNowUnique(),
    });

    const groupContent = expectGroupContent(group.getCurrentContent());
    const { secret: readKey, id: readKeyID } = newRandomKeySecret();
    const reader = node.createAccount("reader");

    const reader2 = node.createAccount("reader2");

    groupContent.edit((editable) => {
        const revelation1 = seal(
            readKey,
            admin.currentSealerSecret(),
            admin.currentSealerID(),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${admin.id}`, revelation1, "trusting");

        const revelation2 = seal(
            readKey,
            admin.currentSealerSecret(),
            reader.currentSealerID(),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${reader.id}`, revelation2, "trusting");

        const revelation3 = seal(
            readKey,
            admin.currentSealerSecret(),
            reader2.currentSealerID(),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${reader2.id}`, revelation3, "trusting");

        editable.set("readKey", readKeyID, "trusting");
        expect(editable.get("readKey")).toEqual(readKeyID);
        expect(group.getCurrentReadKey().secret).toEqual(readKey);

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
        const newRevelation1 = seal(
            readKey2,
            admin.currentSealerSecret(),
            admin.currentSealerID(),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

        editable.set(
            `${readKeyID2}_for_${admin.id}`,
            newRevelation1,
            "trusting"
        );

        const newRevelation2 = seal(
            readKey2,
            admin.currentSealerSecret(),
            reader2.currentSealerID(),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

        editable.set(
            `${readKeyID2}_for_${reader2.id}`,
            newRevelation2,
            "trusting"
        );

        editable.set("readKey", readKeyID2, "trusting");
        expect(editable.get("readKey")).toEqual(readKeyID2);
        expect(group.getCurrentReadKey().secret).toEqual(readKey2);

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

    const secondReadKey = childObject.coValue.getCurrentReadKey();

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

test("Can create two owned objects in the same group and they will have different ids", () => {
    const { node, group } = newGroup();

    const childObject1 = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByGroup", group: group.id },
        meta: null,
        ...createdNowUnique(),
    });

    const childObject2 = node.createCoValue({
        type: "comap",
        ruleset: { type: "ownedByGroup", group: group.id },
        meta: null,
        ...createdNowUnique(),
    });

    expect(childObject1.id).not.toEqual(childObject2.id);
});

test("Admins can create an adminInvite, which can add an admin", () => {
    const { node, group, admin } = newGroup();

    const inviteSecret = newRandomAgentSecret();
    const inviteID = getAgentID(inviteSecret);

    expectGroupContent(group.getCurrentContent()).edit((editable) => {
        const { secret: readKey, id: readKeyID } = newRandomKeySecret();
        const revelation = seal(
            readKey,
            admin.currentSealerSecret(),
            admin.currentSealerID(),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${admin.id}`, revelation, "trusting");
        editable.set("readKey", readKeyID, "trusting");

        editable.set(inviteID, "adminInvite", "trusting");

        expect(editable.get(inviteID)).toEqual("adminInvite");

        const revelationForInvite = seal(
            readKey,
            admin.currentSealerSecret(),
            getAgentSealerID(inviteID),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

        editable.set(
            `${readKeyID}_for_${inviteID}`,
            revelationForInvite,
            "trusting"
        );
    });

    const groupAsInvite = group.testWithDifferentAccount(
        new AnonymousControlledAccount(inviteSecret),
        newRandomSessionID(inviteID)
    );

    const invitedAdminSecret = newRandomAgentSecret();
    const invitedAdminID = getAgentID(invitedAdminSecret);

    expectGroupContent(groupAsInvite.getCurrentContent()).edit((editable) => {
        editable.set(invitedAdminID, "admin", "trusting");

        expect(editable.get(invitedAdminID)).toEqual("admin");

        const readKey = groupAsInvite.getCurrentReadKey();

        expect(readKey.secret).toBeDefined();

        const revelation = seal(
            readKey.secret!,
            getAgentSealerSecret(invitedAdminSecret),
            getAgentSealerID(invitedAdminID),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

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

    const groupAsInvitedAdmin = new Group(
        await nodeAsInvitedAdmin.load(group.id),
        nodeAsInvitedAdmin
    );

    expect(groupAsInvitedAdmin.groupMap.get(invitedAdminID)).toEqual("admin");
    expect(
        groupAsInvitedAdmin.groupMap.coValue.getCurrentReadKey().secret
    ).toBeDefined();

    groupAsInvitedAdmin.addMember(thirdAdminID, "admin");

    expect(groupAsInvitedAdmin.groupMap.get(thirdAdminID)).toEqual("admin");
});

test("Admins can create a writerInvite, which can add a writer", () => {
    const { node, group, admin } = newGroup();

    const inviteSecret = newRandomAgentSecret();
    const inviteID = getAgentID(inviteSecret);

    expectGroupContent(group.getCurrentContent()).edit((editable) => {
        const { secret: readKey, id: readKeyID } = newRandomKeySecret();
        const revelation = seal(
            readKey,
            admin.currentSealerSecret(),
            admin.currentSealerID(),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${admin.id}`, revelation, "trusting");
        editable.set("readKey", readKeyID, "trusting");

        editable.set(inviteID, "writerInvite", "trusting");

        expect(editable.get(inviteID)).toEqual("writerInvite");

        const revelationForInvite = seal(
            readKey,
            admin.currentSealerSecret(),
            getAgentSealerID(inviteID),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

        editable.set(
            `${readKeyID}_for_${inviteID}`,
            revelationForInvite,
            "trusting"
        );
    });

    const groupAsInvite = group.testWithDifferentAccount(
        new AnonymousControlledAccount(inviteSecret),
        newRandomSessionID(inviteID)
    );

    const invitedWriterSecret = newRandomAgentSecret();
    const invitedWriterID = getAgentID(invitedWriterSecret);

    expectGroupContent(groupAsInvite.getCurrentContent()).edit((editable) => {
        editable.set(invitedWriterID, "writer", "trusting");

        expect(editable.get(invitedWriterID)).toEqual("writer");

        const readKey = groupAsInvite.getCurrentReadKey();

        expect(readKey.secret).toBeDefined();

        const revelation = seal(
            readKey.secret!,
            getAgentSealerSecret(invitedWriterSecret),
            getAgentSealerID(invitedWriterID),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

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

    const groupAsInvitedWriter = new Group(
        await nodeAsInvitedWriter.load(group.id),
        nodeAsInvitedWriter
    );

    expect(groupAsInvitedWriter.groupMap.get(invitedWriterID)).toEqual("writer");
    expect(
        groupAsInvitedWriter.groupMap.coValue.getCurrentReadKey().secret
    ).toBeDefined();
});


test("Admins can create a readerInvite, which can add a reader", () => {
    const { node, group, admin } = newGroup();

    const inviteSecret = newRandomAgentSecret();
    const inviteID = getAgentID(inviteSecret);

    expectGroupContent(group.getCurrentContent()).edit((editable) => {
        const { secret: readKey, id: readKeyID } = newRandomKeySecret();
        const revelation = seal(
            readKey,
            admin.currentSealerSecret(),
            admin.currentSealerID(),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${admin.id}`, revelation, "trusting");
        editable.set("readKey", readKeyID, "trusting");

        editable.set(inviteID, "readerInvite", "trusting");

        expect(editable.get(inviteID)).toEqual("readerInvite");

        const revelationForInvite = seal(
            readKey,
            admin.currentSealerSecret(),
            getAgentSealerID(inviteID),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

        editable.set(
            `${readKeyID}_for_${inviteID}`,
            revelationForInvite,
            "trusting"
        );
    });

    const groupAsInvite = group.testWithDifferentAccount(
        new AnonymousControlledAccount(inviteSecret),
        newRandomSessionID(inviteID)
    );

    const invitedReaderSecret = newRandomAgentSecret();
    const invitedReaderID = getAgentID(invitedReaderSecret);

    expectGroupContent(groupAsInvite.getCurrentContent()).edit((editable) => {
        editable.set(invitedReaderID, "reader", "trusting");

        expect(editable.get(invitedReaderID)).toEqual("reader");

        const readKey = groupAsInvite.getCurrentReadKey();

        expect(readKey.secret).toBeDefined();

        const revelation = seal(
            readKey.secret!,
            getAgentSealerSecret(invitedReaderSecret),
            getAgentSealerID(invitedReaderID),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

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

    const groupAsInvitedReader = new Group(
        await nodeAsInvitedReader.load(group.id),
        nodeAsInvitedReader
    );

    expect(groupAsInvitedReader.groupMap.get(invitedReaderID)).toEqual("reader");
    expect(
        groupAsInvitedReader.groupMap.coValue.getCurrentReadKey().secret
    ).toBeDefined();
});

test("WriterInvites can not invite admins", () => {
    const { node, group, admin } = newGroup();

    const inviteSecret = newRandomAgentSecret();
    const inviteID = getAgentID(inviteSecret);

    expectGroupContent(group.getCurrentContent()).edit((editable) => {
        const { secret: readKey, id: readKeyID } = newRandomKeySecret();
        const revelation = seal(
            readKey,
            admin.currentSealerSecret(),
            admin.currentSealerID(),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${admin.id}`, revelation, "trusting");
        editable.set("readKey", readKeyID, "trusting");

        editable.set(inviteID, "writerInvite", "trusting");

        expect(editable.get(inviteID)).toEqual("writerInvite");

        const revelationForInvite = seal(
            readKey,
            admin.currentSealerSecret(),
            getAgentSealerID(inviteID),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

        editable.set(
            `${readKeyID}_for_${inviteID}`,
            revelationForInvite,
            "trusting"
        );
    });

    const groupAsInvite = group.testWithDifferentAccount(
        new AnonymousControlledAccount(inviteSecret),
        newRandomSessionID(inviteID)
    );

    const invitedAdminSecret = newRandomAgentSecret();
    const invitedAdminID = getAgentID(invitedAdminSecret);

    expectGroupContent(groupAsInvite.getCurrentContent()).edit((editable) => {
        editable.set(invitedAdminID, "admin", "trusting");
        expect(editable.get(invitedAdminID)).toBeUndefined();
    });
});

test("ReaderInvites can not invite admins", () => {
    const { node, group, admin } = newGroup();

    const inviteSecret = newRandomAgentSecret();
    const inviteID = getAgentID(inviteSecret);

    expectGroupContent(group.getCurrentContent()).edit((editable) => {
        const { secret: readKey, id: readKeyID } = newRandomKeySecret();
        const revelation = seal(
            readKey,
            admin.currentSealerSecret(),
            admin.currentSealerID(),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${admin.id}`, revelation, "trusting");
        editable.set("readKey", readKeyID, "trusting");

        editable.set(inviteID, "readerInvite", "trusting");

        expect(editable.get(inviteID)).toEqual("readerInvite");

        const revelationForInvite = seal(
            readKey,
            admin.currentSealerSecret(),
            getAgentSealerID(inviteID),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

        editable.set(
            `${readKeyID}_for_${inviteID}`,
            revelationForInvite,
            "trusting"
        );
    });

    const groupAsInvite = group.testWithDifferentAccount(
        new AnonymousControlledAccount(inviteSecret),
        newRandomSessionID(inviteID)
    );

    const invitedAdminSecret = newRandomAgentSecret();
    const invitedAdminID = getAgentID(invitedAdminSecret);

    expectGroupContent(groupAsInvite.getCurrentContent()).edit((editable) => {
        editable.set(invitedAdminID, "admin", "trusting");
        expect(editable.get(invitedAdminID)).toBeUndefined();
    });
});

test("ReaderInvites can not invite writers", () => {
    const { node, group, admin } = newGroup();

    const inviteSecret = newRandomAgentSecret();
    const inviteID = getAgentID(inviteSecret);

    expectGroupContent(group.getCurrentContent()).edit((editable) => {
        const { secret: readKey, id: readKeyID } = newRandomKeySecret();
        const revelation = seal(
            readKey,
            admin.currentSealerSecret(),
            admin.currentSealerID(),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

        editable.set(`${readKeyID}_for_${admin.id}`, revelation, "trusting");
        editable.set("readKey", readKeyID, "trusting");

        editable.set(inviteID, "readerInvite", "trusting");

        expect(editable.get(inviteID)).toEqual("readerInvite");

        const revelationForInvite = seal(
            readKey,
            admin.currentSealerSecret(),
            getAgentSealerID(inviteID),
            {
                in: group.id,
                tx: group.nextTransactionID(),
            }
        );

        editable.set(
            `${readKeyID}_for_${inviteID}`,
            revelationForInvite,
            "trusting"
        );
    });

    const groupAsInvite = group.testWithDifferentAccount(
        new AnonymousControlledAccount(inviteSecret),
        newRandomSessionID(inviteID)
    );

    const invitedWriterSecret = newRandomAgentSecret();
    const invitedWriterID = getAgentID(invitedWriterSecret);

    expectGroupContent(groupAsInvite.getCurrentContent()).edit((editable) => {
        editable.set(invitedWriterID, "writer", "trusting");
        expect(editable.get(invitedWriterID)).toBeUndefined();
    });
});
