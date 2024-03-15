import { BinaryCoStreamI, CoStreamSchema } from "./coStream.js";

function CoStreamOfHelper<Self, Item>(itemSchema: Item) {
    class CoStreamOfItem {}

    return CoStreamOfItem as CoStreamSchema<Self, Item>;
}

export function CoStreamOf<Self>() {
    return function <Item>(itemSchema: Item) {
        return CoStreamOfHelper<Self, Item>(itemSchema);
    };
}

export class BinaryCoStream implements BinaryCoStreamI {

}