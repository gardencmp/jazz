import {
  CoValue,
  CoValueBase,
  CoValueClass,
  CoValueFromRaw,
} from "../internal.js";

export abstract class SchemaUnion extends CoValueBase implements CoValue {
  static fromRaw<V extends CoValue>(this: CoValueClass<V>, raw: V["_raw"]): V {
    throw new Error("Not implemented");
  }

  static Of<V extends CoValue>(
    discriminator: (raw: V["_raw"]) => CoValueClass<V> & CoValueFromRaw<V>,
  ): CoValueClass<V> & typeof SchemaUnion {
    return class SchemaUnionClass extends SchemaUnion {
      static override fromRaw<T extends CoValue>(
        this: CoValueClass<T> & CoValueFromRaw<T>,
        raw: T["_raw"],
      ): T {
        const ResolvedClass = discriminator(
          raw as V["_raw"],
        ) as unknown as CoValueClass<T> & CoValueFromRaw<T>;
        return ResolvedClass.fromRaw(raw);
      }
    } as unknown as CoValueClass<V> & typeof SchemaUnion;
  }
}
