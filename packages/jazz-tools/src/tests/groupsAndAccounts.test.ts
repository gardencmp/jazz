import { expect, describe, test, beforeEach } from "vitest";

import { webcrypto } from "node:crypto";
import { Account, jazzReady, CoMap, co, Group } from "..";

if (!("crypto" in globalThis)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).crypto = webcrypto;
}

beforeEach(async () => {
    await jazzReady;
});

describe("Custom accounts and groups", async () => {
    class CustomProfile extends CoMap<CustomProfile> {
        name = co.string;
        color = co.string;
    }

    class CustomAccount extends Account<CustomAccount> {
        profile = co.ref(CustomProfile);
        root = co.ref(CoMap);

        migrate(creationProps?: { name: string }) {
            if (creationProps) {
                const profileGroup = new Group({ owner: this });
                profileGroup.addMember("everyone", "reader");
                this.profile = new CustomProfile(
                    { name: creationProps.name, color: "blue" },
                    { owner: this }
                );
            }
        }
    }

    class CustomGroup extends Group<CustomGroup> {
        profile = co.null;
        root = co.null;
        [co.members] = co.ref(CustomAccount);
    }

    type T = CustomGroup[typeof co.members];

    test("Custom account and group", async () => {
        const me = await CustomAccount.create({
            creationProps: { name: "Hermes Puggington" },
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

        await new Promise<void>((resolve) => {
            group.subscribe((update) => {
                const meAsMember = update.members.find((member) => {
                    return member.id === me.id && member.account?.profile;
                });
                if (meAsMember) {
                    expect(meAsMember.account?.profile?.name).toBe(
                        "Hermes Puggington"
                    );
                    expect(meAsMember.account?.profile?.color).toBe("blue");
                    resolve();
                }
            });
        });
    });
});
