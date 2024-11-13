import { RawGroup } from "cojson";
import { describe, expect, test } from "vitest";
import { Account, CoMap, Group, WasmCrypto, co } from "../index.web.js";

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

    console.log(
      group.id,
      group._raw.core.getDependedOnCoValuesUncached(),
      parentGroup.id,
    );

    console.log(
      (group._raw.core.getCurrentContent() as RawGroup)
        .keys()
        .filter((k) => k.startsWith("parent_"))
        .map((k) => k.replace("parent_", "")),
    );

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
});
