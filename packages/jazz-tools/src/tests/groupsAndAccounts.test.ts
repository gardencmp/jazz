import { expect, describe, test } from "vitest";
import { Account, CoMap, co, Group, WasmCrypto } from "../index.js";

const Crypto = await WasmCrypto.create();

describe("Custom accounts and groups", async () => {
    class CustomProfile extends CoMap {
        name = co.string;
        color = co.string;
    }

    class CustomAccount extends Account {
        profile = co.ref(CustomProfile);
        root = co.ref(CoMap);

        migrate(creationProps?: { name: string }) {
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
            group.subscribe({  }, (update) => {
                const meAsMember = update.members.find((member) => {
                    return member.id === me.id && member.account?.profile;
                });
                if (meAsMember) {
                    expect(meAsMember.account?.profile?.name).toBe(
                        "Hermes Puggington",
                    );
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
            .as(CustomGroup)
            .members.find((member) => member.id === me.id);
        expect(meAsCastMember?.account?.profile?.name).toBe(
            "Hermes Puggington",
        );
        expect(meAsCastMember?.account?.profile?.color).toBe("blue");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((map._owner as any).nMembers).toBeUndefined();
        expect(map._owner.as(CustomGroup).nMembers).toBe(2);
    });
});
