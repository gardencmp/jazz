import {
    Highlight,
    Class,
    PropDecl,
    ClassRef,
    PropRef,
    PropCategory,
    FnDecl,
    NewCoValueExplainer,
    RefValueExplainer,
} from "@/components/docs/tags";

export function CoMapDocs() {
    return (
        <>
            <Class
                name="CoMap<Fields>"
                doc="CoMaps are collaborative versions of plain objects, mapping string-like keys to values."
            >
                <PropCategory name="Declaration" />

                <pre className="text-xs mt-4">
                    <Highlight>
                        {`import { co, CoMap } from "jazz-tools";

class Person extends CoMap<Person> {
    name = co.string;
    age = co.number;
    pet = co.ref(Animal);
}`}
                    </Highlight>
                </pre>

                <PropCategory name="Contents" />

                <PropDecl
                    name={`coMap["key"]\ncoMap.key`}
                    type={`Fields[key]`}
                    doc={
                        <>
                            <p>
                                The properties declared on this{" "}
                                <ClassRef name="CoMap" />, behaving like a
                                regular plain object, so you can use dot
                                notation to get/set them, use{" "}
                                <PropRef on="Object" prop="keys()" /> to iterate
                                over them, etc.
                            </p>

                            <p>
                                <RefValueExplainer propName="properties" />
                            </p>
                        </>
                    }
                    example={
                        <pre>
                            <Highlight>{`person.name;
person["age"];
person.age = 42;
person.pet?.name;
Object.keys(person);
// => ["name", "age", "pet"]`}</Highlight>
                        </pre>
                    }
                />

                <PropDecl
                    name={`coMap.id`}
                    type={`ID<this>`}
                    doc={
                        <>
                            The ID of this <ClassRef name="CoMap" />
                        </>
                    }
                    example={
                        <pre>
                            <Highlight>{`person.id; // => "co_zjAnmRAbL3oC3233vfWvZ7gHrXE"`}</Highlight>
                        </pre>
                    }
                />

                <PropDecl
                    name={`coMap._refs`}
                    type={`{ [K in Fields]: Fields[K] extends CoValue
    ? Ref<Fields[K]>
    : never }`}
                    doc={
                        <>
                            If property `<PropRef prop="prop" />` is a{" "}
                            <PropRef on="co" prop="ref(...)" />, you can use{" "}
                            <PropRef on="coMap" prop="_refs.prop" /> to access
                            the <ClassRef name="Ref" /> instead of the
                            potentially loaded/null value. This allows you to
                            always get the ID or load the value manually.
                        </>
                    }
                    example={
                        <pre>
                            <Highlight>{`person._refs.pet.id; // => ID<Animal>
person._refs.pet.value;
// => Animal | undefined
const pet = await person._refs.pet.load();`}</Highlight>
                        </pre>
                    }
                />

                <PropCategory name="Construction" />

                <FnDecl
                    signature={`new CoMap(init, { owner })`}
                    paramTypes={`init: Fields,
{ owner: Account | Group }`}
                    returnType={`CoMap<Fields>`}
                    doc={<NewCoValueExplainer type="CoMap" />}
                    example={
                        <pre>
                            <Highlight>{`const alice = new Person(
    {
        name: "Alice",
        age: 30,
        pet: garfield
    },
    { owner: hrGroup }
);`}</Highlight>
                        </pre>
                    }
                />

                <PropCategory name="Loading & Subscription" />

                <FnDecl
                    signature={`CoMap.load(id, { as })`}
                    paramTypes={`id: ID<this>,
{ as: Account & Me }`}
                    returnType={`Promise<this | undefined>`}
                    example={
                        <pre>
                            <Highlight>{`const peterID = "co_zjAnmRAbL3oC3233vfWvZ7gHrXE";
const peter = await Person.load(peterID, {
    as: me
});`}</Highlight>
                        </pre>
                    }
                />

                {/* <FnDecl
    signature={`CoMap.loadEf(id)`}
    paramTypes={`id: ID<this>`}
    returnType={`Effect<this, UnavailableError, AccountCtx>`}
    example={
        <pre>
            <Highlight>{`const peterID = "co_zjAnmRAbL3oC3233vfWvZ7gHrXE";
const eff = Effect.gen(function*() {
    const peter = yield* Person.loadEf(peterID);
});
Effect.runPromise(
    Effect.provideService(eff, AccountCtx, me)
);
`}</Highlight>
        </pre>
    }
/> */}

                <FnDecl
                    signature={`CoMap.subscribe(id, { as }, onUpdate)`}
                    paramTypes={`id: ID<this>,
{ as: Account & Me },
onUpdate: (value: this) => void
returns: () => void`}
                />

                {/* <FnDecl
    signature={`CoMap.subscribeEf(id)`}
    paramTypes={`id: ID<this>
returns: Stream<this, UnavailableError, AccountCtx>`}
/> */}

                <FnDecl
                    signature={`coMap.subscribe(onUpdate)`}
                    paramTypes={`onUpdate: (value: this) => void
returns: () => void`}
                />

                {/* <FnDecl
    signature={`coMap.subscribeEf()`}
    paramTypes={`returns: Stream<this, UnavailableError, AccountCtx>`}
/> */}

                <PropCategory name="Collaboration" />

                <PropDecl
                    name={`coMap._edits`}
                    type={`{ [K in Fields]: {
    value?: Fields[K];
    ref?: RefIfCoValue<Fields[K]>;
    by?: Account;
    madeAt: Date;
    all: { value?: Fields[K]; ... }[];
} }`}
                    doc={
                        <>
                            <p className="mb-4">
                                Lets you access the edit history for each
                                property in this <ClassRef name="CoMap" />.
                                Directly includes the current value, the{" "}
                                <ClassRef name="Ref" /> if the property holds a
                                reference, the author{" "}
                                <ClassRef name="Account" />, and the timestamp.
                            </p>
                            <p>
                                Access whole edit history with `all`, with
                                entries of the same shape.
                            </p>
                        </>
                    }
                />

                <PropDecl
                    name={`coMap._owner`}
                    type={`Account | Group`}
                    doc={
                        <>
                            The <ClassRef name="Account" /> or{" "}
                            <ClassRef name="Group" /> that owns this{" "}
                            <ClassRef name="CoMap" />.
                        </>
                    }
                />

                <PropCategory name="Type info" />

                <PropDecl
                    name={`coMap._type`}
                    type={`"CoMap"`}
                    doc={
                        <>
                            Distinguishes this as a <ClassRef name="CoMap" />{" "}
                            from other CoValues
                        </>
                    }
                />
                <PropDecl
                    name={`coMap._schema`}
                    type={`{ [Key in CoKeys<Fields>]: SchemaFor<Fields[Key]>; }`}
                    doc={
                        <>
                            Stores the schema for each property in this{" "}
                            <ClassRef name="CoMap" />. Define with{" "}
                            <PropRef prop={"co(...)"} />.
                        </>
                    }
                />
            </Class>
        </>
    );
}
