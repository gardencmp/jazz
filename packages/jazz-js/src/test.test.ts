import { CoMapOf, SimpleAccount, imm } from './index.js'

test("Can create simple comap", async () => {
    const me = await SimpleAccount.createControlledAccount({
        name: "Hermes Puggington",
    });

    class TestMap extends CoMapOf({
        color: imm.string,
    }) {}

    const map = new TestMap({
        color: "red",
    }, {owner: me});

    expect(map.color).toEqual("red");
});