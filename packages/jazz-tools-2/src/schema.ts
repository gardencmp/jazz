const Kind = Symbol.for("jazz:kind");
type Kind = typeof Kind;

export type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};

class AbstractSchema {
  [Kind]: string = "any";

  static descriptor<Self extends { new (): AbstractSchema }>(
    this: Self,
  ): InstanceType<Self> {
    return new this() as InstanceType<Self>;
  }
}

class StringSchema extends AbstractSchema {
  [Kind] = "string" as const;
}
class NumberSchema extends AbstractSchema {
  [Kind] = "number" as const;
}

const f = {
  string: StringSchema,
  number: NumberSchema,
};

class CoMap extends AbstractSchema {
  [Kind] = "comap" as const;

  static load<Self extends { new (): CoMap }>(
    this: Self,
    id: string,
  ): Promise<Loaded<InstanceType<Self>> & {}> {
    throw new Error("not yet implemented");
  }
}

class CoList extends AbstractSchema {
  [Kind] = "colist" as const;

  static Of<I extends { new (): Schema }>(
    item: I,
  ): { new (): CoListOf<InstanceType<I>> } {
    return class extends CoList {
      item = item;
    };
  }
}

type CoListOf<I extends Schema> = CoList & { item: { new (): I } };

class CoFeed extends AbstractSchema {
  [Kind] = "cofeed" as const;
}

type CoMapSchema = { [Kind]: "comap" };
type CoListSchema = {
  [Kind]: "colist";
  item: PrimitiveSchema | { new (): CoValueSchema };
};
type CoFeedSchema = {
  [Kind]: "cofeed";
  item: PrimitiveSchema | { new (): CoValueSchema };
};

type PrimitiveSchema = typeof StringSchema | typeof NumberSchema;
type CoValueSchema = CoMapSchema | CoListSchema | CoFeedSchema;

type Schema = CoValueSchema | PrimitiveSchema;

type Unloaded<T extends CoValueSchema> = {
  $loaded: false;
  $co: { id: ID<T> };
};

type PrimitiveOf<S extends PrimitiveSchema> =
  InstanceType<S>[Kind] extends "string"
    ? string
    : InstanceType<S>[Kind] extends "number"
      ? number
      : never;

type Loaded<T extends CoValueSchema> = (T extends CoMapSchema
  ? {
      readonly [Key in keyof T & string]: T[Key] extends PrimitiveSchema
        ? PrimitiveOf<T[Key]>
        : T[Key] extends Array<{ new (): CoValueSchema }>
          ? MaybeLoaded<CoListOf<InstanceType<T[Key][number]>>>
          : T[Key] extends { new (): CoValueSchema }
            ? MaybeLoaded<InstanceType<T[Key]>>
            : never;
    }
  : T extends CoListSchema & { item: infer I }
    ? I extends PrimitiveSchema
      ? readonly PrimitiveOf<I>[]
      : I extends { new (): CoValueSchema }
        ? readonly MaybeLoaded<InstanceType<I>>[]
        : never
    : T extends CoFeedSchema & { item: infer I }
      ? I extends PrimitiveSchema
        ? { readonly [account: string]: PrimitiveOf<I> }
        : I extends { new (): CoValueSchema }
          ? {
              readonly [account: string]: MaybeLoaded<InstanceType<I>>;
            }
          : never
      : never) & {
  readonly $co: {
    id: ID<T>;
    update: (updater: (mutable: Mutable<T>) => void) => Loaded<T>;
  };
  readonly $loaded: true;
  readonly $coType: T[Kind];
};

type Mutable<T extends CoValueSchema> = (T extends CoMapSchema
  ? {
      [Key in keyof T & string]: T[Key] extends PrimitiveSchema
        ? PrimitiveOf<T[Key]>
        : T[Key] extends Array<{ new (): CoValueSchema }>
          ? MaybeLoadedAndMutable<CoListOf<InstanceType<T[Key][number]>>>
          : T[Key] extends { new (): CoValueSchema }
            ? MaybeLoadedAndMutable<InstanceType<T[Key]>>
            : never;
    }
  : T extends CoListSchema & { item: infer I }
    ? I extends PrimitiveSchema
      ? readonly PrimitiveOf<I>[]
      : I extends { new (): CoValueSchema }
        ? MaybeLoadedAndMutable<InstanceType<I>>[]
        : never
    : T extends CoFeedSchema & { item: infer I }
      ? I extends PrimitiveSchema
        ? { [account: string]: PrimitiveOf<I> }
        : I extends { new (): CoValueSchema }
          ? {
              [account: string]: MaybeLoadedAndMutable<InstanceType<I>>;
            }
          : never
      : never) & {
  readonly $co: {
    id: ID<T>;
    update: (updater: (mutable: Mutable<T>) => void) => Loaded<T>;
  };
  readonly $loaded: true;
  readonly $coType: T[Kind];
};

type MaybeLoaded<T extends CoValueSchema> = Loaded<T> | Unloaded<T>;
type MaybeLoadedAndMutable<T extends CoValueSchema> = Mutable<T> | Unloaded<T>;

type ID<C extends CoValueSchema> = string & { __type: C };

// USAGE

class Person extends CoMap {
  name = f.string;
  age = f.number;
}

const person = await Person.load("co_zcs5apCAcE4KLnQZ1Fw8HRDGar1");

class Profile extends CoMap {
  status = Person;
}

const profile = await Profile.load("co_skjdfhi743");
if (profile.status.$loaded) {
  profile.status.name;
}

class ListOfProfiles extends CoList {
  item = Profile;
}

type LT = Loaded<ListOfProfiles>;

class ListOfProfiles2 extends CoList.Of(Profile) {}

type LT2 = Loaded<ListOfProfiles2>;

class Circle extends CoMap {
  profiles = [Profile];
}

type LC = Loaded<Circle>;
type LCL = Exclude<LC["profiles"], Unloaded<any>>;

class Feed extends CoFeed {
  item = Person;
}

type LF = Loaded<Feed>;

class Mapping extends CoMap.Record {
  key = f.string;
  value = Feed;
}
