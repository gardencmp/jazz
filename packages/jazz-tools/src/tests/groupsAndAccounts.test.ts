import { RawGroup } from "cojson";
import { describe, expect, test } from "vitest";
import { Account, CoMap, Group, WasmCrypto, co } from "../index.web.js";
import { setupTwoNodes, waitFor } from "./utils.js";

const Crypto = await WasmCrypto.create();

describe("Custom accounts and groups", async () => {
  class CustomProfile extends CoMap {
    name = co.string;
    color = co.string;
  }

  class CustomAccount extends Account {
    profile = co.ref(CustomProfile);
    root = co.ref(CoMap);

    migrate(this: CustomAccount, creationProps?: { name: string }) {
      if (creationProps) {
        const profileGroup = Group.create({ owner: this });
        profileGroup.addMember("everyone", "reader");
        this.profile = CustomProfile.create(
          { name: creationProps.name, color: "blue" },
          { owner: this },
        );
      }
    }
  }

  class CustomGroup extends Group {
    profile = co.null;
    root = co.null;
    [co.members] = co.ref(CustomAccount);

    get nMembers() {
      return this.members.length;
    }
  }

  test("Custom account and group", async () => {
    const me = await CustomAccount.create({
      creationProps: { name: "Hermes Puggington" },
      crypto: Crypto,
    });

    expect(me.profile).toBeDefined();
    expect(me.profile?.name).toBe("Hermes Puggington");
    expect(me.profile?.color).toBe("blue");

    const group = new CustomGroup({ owner: me });
    group.addMember("everyone", "reader");

    expect(group.members).toMatchObject([
      { id: me.id, role: "admin" },
      { id: "everyone", role: "reader" },
    ]);

    expect(group.nMembers).toBe(2);

    await new Promise<void>((resolve) => {
      group.subscribe({}, (update) => {
        const meAsMember = update.members.find((member) => {
          return member.id === me.id && member.account?.profile;
        });
        if (meAsMember) {
          expect(meAsMember.account?.profile?.name).toBe("Hermes Puggington");
          expect(meAsMember.account?.profile?.color).toBe("blue");
          resolve();
        }
      });
    });

    class MyMap extends CoMap {
      name = co.string;
    }

    const map = MyMap.create({ name: "test" }, { owner: group });

    const meAsCastMember = map._owner
      .castAs(CustomGroup)
      .members.find((member) => member.id === me.id);
    expect(meAsCastMember?.account?.profile?.name).toBe("Hermes Puggington");
    expect(meAsCastMember?.account?.profile?.color).toBe("blue");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((map._owner as any).nMembers).toBeUndefined();
    expect(map._owner.castAs(CustomGroup).nMembers).toBe(2);
  });
});

describe("Group inheritance", () => {
  class TestMap extends CoMap {
    title = co.string;
  }

  test("Group inheritance", async () => {
    const me = await Account.create({
      creationProps: { name: "Hermes Puggington" },
      crypto: Crypto,
    });

    const parentGroup = Group.create({ owner: me });
    const group = Group.create({ owner: me });

    group.extend(parentGroup);

    const reader = await Account.createAs(me, {
      creationProps: { name: "Reader" },
    });

    parentGroup.addMember(reader, "reader");

    const mapInChild = TestMap.create({ title: "In Child" }, { owner: group });

    const mapAsReader = await TestMap.load(mapInChild.id, reader, {});
    expect(mapAsReader?.title).toBe("In Child");

    parentGroup.removeMember(reader);

    mapInChild.title = "In Child (updated)";

    const mapAsReaderAfterUpdate = await TestMap.load(
      mapInChild.id,
      reader,
      {},
    );
    expect(mapAsReaderAfterUpdate?.title).toBe("In Child");
  });

  test("Group inheritance with grand-children", async () => {
    const me = await Account.create({
      creationProps: { name: "Hermes Puggington" },
      crypto: Crypto,
    });

    const grandParentGroup = Group.create({ owner: me });
    const parentGroup = Group.create({ owner: me });
    const group = Group.create({ owner: me });

    group.extend(parentGroup);
    parentGroup.extend(grandParentGroup);

    const reader = await Account.createAs(me, {
      creationProps: { name: "Reader" },
    });

    grandParentGroup.addMember(reader, "reader");

    const mapInGrandChild = TestMap.create(
      { title: "In Grand Child" },
      { owner: group },
    );

    const mapAsReader = await TestMap.load(mapInGrandChild.id, reader, {});
    expect(mapAsReader?.title).toBe("In Grand Child");

    grandParentGroup.removeMember(reader);

    mapInGrandChild.title = "In Grand Child (updated)";

    const mapAsReaderAfterUpdate = await TestMap.load(
      mapInGrandChild.id,
      reader,
      {},
    );
    expect(mapAsReaderAfterUpdate?.title).toBe("In Grand Child");
  });

  test("Group inheritance should fail if the current account doesn't have admin role in both groups", async () => {
    const me = await Account.create({
      creationProps: { name: "Hermes Puggington" },
      crypto: Crypto,
    });

    const other = await Account.createAs(me, {
      creationProps: { name: "Another user" },
    });

    const parentGroup = Group.create({ owner: me });
    parentGroup.addMember(other, "writer");
    const group = Group.create({ owner: me });
    group.addMember(other, "admin");

    const parentGroupOnTheOtherSide = await Group.load(
      parentGroup.id,
      other,
      {},
    );
    const groupOnTheOtherSide = await Group.load(group.id, other, {});

    if (!groupOnTheOtherSide || !parentGroupOnTheOtherSide) {
      throw new Error("CoValue not available");
    }

    expect(() => groupOnTheOtherSide.extend(parentGroupOnTheOtherSide)).toThrow(
      "To extend a group, the current account must have admin role in both groups",
    );
  });

  test("Group inheritance should work if the current account has admin role in both groups", async () => {
    const me = await Account.create({
      creationProps: { name: "Hermes Puggington" },
      crypto: Crypto,
    });

    const other = await Account.createAs(me, {
      creationProps: { name: "Another user" },
    });

    const parentGroup = Group.create({ owner: me });
    parentGroup.addMember(other, "admin");
    const group = Group.create({ owner: me });
    group.addMember(other, "admin");

    const parentGroupOnTheOtherSide = await Group.load(
      parentGroup.id,
      other,
      {},
    );
    const groupOnTheOtherSide = await Group.load(group.id, other, {});

    if (!groupOnTheOtherSide || !parentGroupOnTheOtherSide) {
      throw new Error("CoValue not available");
    }

    expect(() =>
      groupOnTheOtherSide.extend(parentGroupOnTheOtherSide),
    ).not.toThrow();
  });

  test("waitForSync should resolve when the value is uploaded", async () => {
    const { clientNode, serverNode, clientAccount } = await setupTwoNodes();

    const group = Group.create({ owner: clientAccount });

    await group.waitForSync({ timeout: 1000 });

    // Killing the client node so the serverNode can't load the map from it
    clientNode.gracefulShutdown();

    const loadedGroup = await serverNode.load(group._raw.id);

    expect(loadedGroup).not.toBe("unavailable");
  });
});
