import {
  Account,
  CoMap,
  CoValue,
  CoValueClass,
  Group,
  ID,
  co,
} from "jazz-tools";

class ExtState extends CoMap {
  extID = co.optional.string;
  state = co.literal("creating", "fetching", "pushing", "synced", "errored");
  lastError = co.optional.string;
}

class CoValuesByExtID extends CoMap.Record(co.json<ID<CoValue>>()) {}
class ExtStatesByCoID extends CoMap.Record(co.optional.ref(ExtState)) {}

// starting a general "sync to external system" framework here that will become part of jazz
export function bridgeExternalSystem<ExtID extends string>(options: {
  systemName: string;
  mappings: Mapping<any, ExtID, any>[];
  worker: Account;
}) {
  async function getCoValuesByExtID() {
    const coValuesByExtID = await CoValuesByExtID.load(
      CoValuesByExtID.findUnique(
        {
          systemName: options.systemName,
        },
        options.worker.id,
        options.worker,
      ),
      options.worker,
      [],
    );
    if (!coValuesByExtID) {
      throw new Error("Couldn't load coValuesByExtID");
    }
    return coValuesByExtID;
  }

  async function getExtStatesByCoID() {
    const extStatesByCoID = await ExtStatesByCoID.load(
      ExtStatesByCoID.findUnique(
        {
          systemName: options.systemName,
        },
        options.worker.id,
        options.worker,
      ),
      options.worker,
      [{}],
    );
    if (!extStatesByCoID) {
      throw new Error("Couldn't load extStatesByCoID");
    }
    return extStatesByCoID;
  }

  function mappingFor<T extends CoValue>(coValue: T): Mapping<T, ExtID, any> {
    const mapping = options.mappings.find(
      (m) => m.Schema === coValue.constructor,
    );
    if (!mapping) {
      throw new Error(`No mapping found for ${coValue.constructor.name}`);
    }
    return mapping as Mapping<T, ExtID, any>;
  }

  async function process(coValue: CoValue, token: string) {
    const coValuesByExtID = await getCoValuesByExtID();
    const extStatesByCoID = await getExtStatesByCoID();

    const mapping = mappingFor(coValue);

    let extState = extStatesByCoID[coValue.id];
    if (!extState) {
      if (mapping.sync.type === "two-way") {
        extState = ExtState.create(
          {
            state: "creating",
          },
          { owner: options.worker },
        );
        extStatesByCoID[coValue.id] = extState;

        try {
          // TODO: do relations first
          const extID = await mapping?.sync.createExt(coValue, token);
          extState.extID = extID;
          extState.state = "synced";
        } catch (e: unknown) {
          extState.state = "errored";
          extState.lastError = e instanceof Error ? e.message : String(e);
        }
      } else {
        console.debug(
          `Not creating external value for ${coValue.id} because ${coValue.constructor.name} only sync one-way`,
        );
      }
    }
  }

  return {
    invalidateExt(id: ExtID[] | "all") {},
    updateRoot(root: CoValue, id: ExtID, currentToken: string): Promise<void> {
      const mapping = mappingFor(root);
    },
  };
}

type Mapping<
  C extends CoValue,
  ExtID extends string,
  ExtValue extends object,
> = {
  Schema: CoValueClass<C>;
  sync:
    | ToJazzSync<C, ExtID, ExtValue>
    | ToExtSync<C, ExtID, ExtValue>
    | TwoWaySync<C, ExtID, ExtValue>;
};

type ToJazzParams<
  C extends CoValue,
  ExtID extends string,
  ExtValue extends object,
> = {
  fetch: (id: ExtID, token: string) => Promise<ExtValue>;

  createFromExt: (id: ExtID, response: ExtValue, owner: Group) => Promise<void>;

  updateFromExt: (id: ExtID, response: ExtValue, coValue: C) => Promise<void>;
  relations?: (keyof C)[];
};

type ToExtParams<
  C extends CoValue,
  ExtID extends string,
  ExtValue extends object,
> = {
  createExt: (coValue: C, token: string) => Promise<ExtID>;

  pushEditsToExt: (id: ExtID, coValue: C, extValue: ExtValue) => Promise<void>;
};

type ToJazzSync<
  C extends CoValue,
  ExtID extends string,
  ExtValue extends object,
> = {
  type: "to-jazz";
} & ToJazzParams<C, ExtID, ExtValue>;

type ToExtSync<
  C extends CoValue,
  ExtID extends string,
  ExtValue extends object,
> = {
  type: "to-ext";
} & ToExtParams<C, ExtID, ExtValue>;

type TwoWaySync<
  C extends CoValue,
  ExtID extends string,
  ExtValue extends object,
> = {
  type: "two-way";
} & ToJazzParams<C, ExtID, ExtValue> &
  ToExtParams<C, ExtID, ExtValue>;

export function mapping<
  C extends CoValue,
  ExtID extends string,
  ExtValue extends object,
>(
  Schema: CoValueClass<C>,
  sync:
    | ToJazzSync<C, ExtID, ExtValue>
    | ToExtSync<C, ExtID, ExtValue>
    | TwoWaySync<C, ExtID, ExtValue>,
): Mapping<C, ExtID, ExtValue> {
  return { Schema, sync };
}
